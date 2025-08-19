-- Resources/Server/RaceVaultSync/main.lua

--======= Web3 / Linking =======
LinkedPlayers = {}
PendingPurchases = {}

--======= Utils =======
local function formatNumber(n)
    local left, num, right = string.match(string.format("%.2f", tonumber(n or 0)), '^([^%d]*%d)(%d*)(%.?%d*)')
    return left .. (num:reverse():gsub("(%d%d%d)", "%1,"):reverse()) .. right
end

local function tolower(s)
    if type(s) ~= "string" then return s end
    return string.lower(s)
end

local function generateVehicleCode(length)
    length = length or 6
    local alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    local code = ""
    for _ = 1, length do
        code = code .. alphabet:sub(math.random(1, #alphabet), 1)
    end
    return code
end

--======= Verified Configs Loader =======
local VC = nil

local function loadVerifiedConfigs()
    if VC then return VC end
    local ok, tbl = pcall(dofile, "Resources/Server/RaceVaultSync/data/VerifiedConfigs.lua")
    if not ok or type(tbl) ~= "table" then
        print("[RaceVaultSync] ⚠️ Failed to load VerifiedConfigs.lua:", tostring(tbl))
        VC = {}
        return VC
    end
    VC = tbl
    print("[RaceVaultSync] ✅ VerifiedConfigs loaded.")
    return VC
end

-- Lookup by (model, configKey) — keys in file are lowercased
local function lookupByModelConfig(model, cfg)
    if not model or not cfg then return nil end
    local atlas = loadVerifiedConfigs()
    model = tolower(model)
    cfg   = tolower(cfg)

    local bucket = atlas[model]
    if not bucket then return nil end

    -- 1) direct key hit (pc filename key)
    local e = bucket[cfg]
    if e then
        return (e.name or e.codename or cfg), (e.value or 0), e
    end

    -- 2) try codename equality
    for _, v in pairs(bucket) do
        if v.codename and tolower(v.codename) == cfg then
            return (v.name or v.codename or cfg), (v.value or 0), v
        end
    end

    return nil
end

-- Fallback: match by parts table from spawn JSON (sorted keys identity)
local function lookupByParts(model, partsTbl)
    if not model or type(partsTbl) ~= "table" then return nil end
    local atlas = loadVerifiedConfigs()
    model = tolower(model)

    local bucket = atlas[model]
    if not bucket then return nil end

    local keys = {}
    for k, _ in pairs(partsTbl) do keys[#keys+1] = k end
    table.sort(keys)
    local base = table.concat(keys, "|")

    -- scan candidates with same key-set
    for cfgKey, v in pairs(bucket) do
        local keys2 = {}
        for k, _ in pairs(v.parts or {}) do keys2[#keys2+1] = k end
        if #keys2 == #keys then
            table.sort(keys2)
            if table.concat(keys2, "|") == base then
                return (v.name or v.codename or cfgKey), (v.value or 0), v
            end
        end
    end

    return nil
end

--======= IGNORE RULES (granular) =======
-- action = "mute"    -> keep vehicle, but NO console/chat/price/POST
-- action = "despawn" -> try to remove vehicle silently if API supports it
local IGNORE_RULES = {
    { model = "simple_traffic",                    action = "despawn" }, -- AI helper
    { model = "unicycle", cfg = "beammp_default",   action = "mute"    }, -- FREE preset
}

-- Optional substring-based config mutes (example: parked variants)
local IGNORE_CFG_SUBSTR = {
    -- "parked",   -- uncomment/add if you want to mute any cfg containing "parked"
}

local function shouldIgnoreSpawn(model, cfg, payloadTbl)
    model = tolower(model or "")
    cfg   = tolower(cfg or "")

    -- exact rules
    for _, r in ipairs(IGNORE_RULES) do
        local ok = true
        if r.model and r.model ~= model then ok = false end
        if ok and r.cfg and r.cfg ~= cfg then ok = false end
        -- You can also use payload fields, e.g. r.aiOnly and payloadTbl.aiMode == "traffic"
        if ok then
            return r.action or "mute"
        end
    end

    -- loose cfg substring mutes
    for _, sub in ipairs(IGNORE_CFG_SUBSTR) do
        if sub and sub ~= "" and cfg:find(sub, 1, true) then
            return "mute"
        end
    end

    return nil
end

local function safeRemoveVehicle(player_id, vehicle_id)
    if type(MP) == "table" and type(MP.RemoveVehicle) == "function" then
        pcall(MP.RemoveVehicle, player_id, vehicle_id)
        return true
    end
    return false
end

local isPolling = false

--======= Poll Function =======
local function pollPurchaseStatuses()

    for playerId, info in pairs(PendingPurchases) do
        repeat
            if type(info) ~= "table" or not info.vehicleCode then
                print(string.format("[pollPurchaseStatuses] Invalid entry for playerId: %s", tostring(playerId)))
                PendingPurchases[playerId] = nil
                break
            end

            -- Timeout (5 min)
            if os.time() - (info.createdAt or 0) > 300 then
                print(string.format("[pollPurchaseStatuses] Purchase timed out for playerId: %s", tostring(playerId)))
                MP.SendChatMessage(playerId, "❌ Purchase timed out. Please try again.")
                PendingPurchases[playerId] = nil
                break
            end

            -- Build URL (no %q!)
            local jsonPath = string.format("purchase_status_%s.json", tostring(playerId))
            local API_BASE_URL = "https://racevault.onrender.com/api"
            local url = string.format(
                "%s/purchase-status?vehicleCode=%s",
                API_BASE_URL, info.vehicleCode
            )

            -- Call API
            local cmd = string.format("curl -s "%s" -o "%s"", url, jsonPath)
            os.execute(cmd)

            local f = io.open(jsonPath, "r")
            if not f then
                print(string.format("[pollPurchaseStatuses] Failed to read %s for playerId: %s", jsonPath, tostring(playerId)))
                break
            end

            local body = f:read("*a")
            f:close()
            os.remove(jsonPath)

            local ok, data = pcall(Util.JsonDecode, body)
            if not ok or type(data) ~= "table" then
                print(string.format("[pollPurchaseStatuses] JSON decode error for playerId: %s, body: %s", tostring(playerId), tostring(body)))
                break
            end

            -- Handle statuses
            if data.status == "confirmed" then
                print(string.format("[pollPurchaseStatuses] ✅ Purchase confirmed for %s", tostring(playerId)))
                MP.SendChatMessage(playerId, "✅ Purchase confirmed, spawning car!")
                PendingPurchases[playerId] = nil
            elseif data.status == "rejected" then
                print(string.format("[pollPurchaseStatuses] ❌ Purchase rejected for %s", tostring(playerId)))
                MP.SendChatMessage(playerId, "❌ Purchase rejected. Car blocked.")
                PendingPurchases[playerId] = nil
            elseif data.status == "failed" then
                print(string.format("[pollPurchaseStatuses] ❌ Purchase failed for %s", tostring(playerId)))
                MP.SendChatMessage(playerId, "❌ Purchase failed. Car blocked.")
                PendingPurchases[playerId] = nil
            end
        until true
    end
    -- If no more pending purchases, stop polling
    if next(PendingPurchases) == nil then
        isPolling = false
        print("[Polling] No more purchases pending, polling stopped.")
    end
end


-- Polling loop using coroutine and os.time (wall-clock)
local function pollingLoop()
    while isPolling do
        pollPurchaseStatuses()
        -- sleep for 10 seconds by yielding once per second
        local target = os.time() + 10
        while os.time() < target and isPolling do
            coroutine.yield()
        end
    end
end

function startPolling()
    if not isPolling then
        isPolling = true
        print("[Polling] Started polling loop...")
        local co = coroutine.create(pollingLoop)
        while isPolling and coroutine.status(co) ~= "dead" do
            local success, err = coroutine.resume(co)
            if not success then
                print("[Polling] Error in coroutine: " .. tostring(err))
                isPolling = false
                break
            end
        end
        isPolling = false
        print("[Polling] Polling loop stopped.")
    end
end



function AddPendingPurchase(player_id, playerName, vehicle_id, model, cfg, tbl, vehicleCode)
    PendingPurchases[player_id] = {
        playerName = playerName,
        vehicleId = vehicle_id,
        model = tostring(model),
        cfg = tostring(cfg),
        configJson = Util.JsonEncode(tbl.vcf),
        createdAt = os.time(),
        vehicleCode = vehicleCode
    }

    print("[PendingPurchases] Added for:", playerName, vehicle_id, "with code:", vehicleCode)
    startPolling()
end

--======= Init / Events =======
function onInit()
    print("[RaceVaultSync] Plugin loaded ✅")
    MP.RegisterEvent("onChatMessage", "handleChatMessage")
    MP.RegisterEvent("onVehicleSpawn", "HandleVehicleSpawn")
    loadVerifiedConfigs()
end

--======= Chat Commands =======
function handleChatMessage(playerID, playerName, message)
    if type(message) ~= "string" then return 0 end

    local cmd, arg = message:match("^/(%w+)%s*(.*)$")
    if not cmd then return 0 end

    cmd = cmd:lower()

    if cmd == "sync" then
        if not arg or arg == "" then
            MP.SendChatMessage(playerID, "Usage: /sync <code>")
        else
            verifySyncCode(playerID, playerName, arg)
        end
        return 1
    elseif cmd == "spawn_car" then
        if not arg or arg == "" then
            MP.SendChatMessage(playerID, "Usage: /spawn_car <vehicle_code>")
        else
            spawnPlayerVehicle(playerID, playerName, arg)
        end
        return 1
    end

    return 0
end

function spawnPlayerVehicle(playerID, playerName, vehicleCode)
    local jsonPath = string.format("Resources/Server/RaceVaultSync/spawn_%d.json", playerID)
    local url = "https://racevault.onrender.com/api/spawn-vehicle"
    local payload = Util.JsonEncode({ vehicleCode = vehicleCode, playerId = playerName })

    local cmd = string.format(
        "curl -s -X POST -H "Content-Type: application/json" -d '%s' "%s" -o "%s"",
        payload, url, jsonPath
    )
    os.execute(cmd)

    local f = io.open(jsonPath, "r")
    if not f then
        MP.SendChatMessage(playerID, "❌ Could not spawn vehicle: no response from server.")
        return
    end

    local body = f:read("*a")
    f:close()
    os.remove(jsonPath)

    local ok, data = pcall(Util.JsonDecode, body)
    if not ok or not data then
        MP.SendChatMessage(playerID, "❌ Could not spawn vehicle: invalid server response.")
        return
    end

    if data.success == true and type(data.configJson) == "table" then
        local configString = Util.JsonEncode(data.configJson)
        MP.SendChatMessage(playerID, "✅ Vehicle spawned!")
    else
        MP.SendChatMessage(playerID, "❌ Spawn failed: " .. (data.message or "Unknown error"))
    end
end

function verifySyncCode(playerID, playerName, code)
    local jsonPath = string.format("Resources/Server/RaceVaultSync/sync_%d.json", playerID)
    local url = "https://racevault.onrender.com/api/verify-sync"
    local cmd = string.format(
        "curl -s -X POST -H "Content-Type: application/json" -d '{"code":"%s","playerId":%q}' "%s" -o "%s"",
        code, playerName, url, jsonPath
    )
    os.execute(cmd)

    local f = io.open(jsonPath, "r")
    if not f then
        MP.SendChatMessage(playerID, "❌ Could not sync: no response from server.")
        return
    end

    local body = f:read("*a")
    f:close()
    os.remove(jsonPath)

    local ok, data = pcall(Util.JsonDecode, body)
    if not ok or not data or data.success ~= true then
        MP.SendChatMessage(playerID, "❌ Invalid or expired sync code.")
        return
    end

    LinkedPlayers[playerID] = {
        wallet = data.wallet,
        balance = data.balance,
        vehicles = data.vehicles or {}
    }

    local short = data.wallet:sub(1,6) .. "..." .. data.wallet:sub(-4)
    MP.SendChatMessage(playerID, "✅ Wallet linked: " .. short)
    MP.SendChatMessage(playerID, "💰 GameCoin: " .. formatNumber(data.balance or 0))
    if #LinkedPlayers[playerID].vehicles > 0 then
        MP.SendChatMessage(playerID, "🚗 NFT Cars: " .. table.concat(LinkedPlayers[playerID].vehicles, ", "))
    else
        MP.SendChatMessage(playerID, "🚗 No NFT cars found.")
    end
end

--======= Car Event Handling =======
-- data looks like: USER:<ign>:<pid>-<vid>:{ ... JSON ... }
function HandleVehicleSpawn(player_id, vehicle_id, data)
    local raw = tostring(data or "")
    local jsStart = raw:find("{")
    if not jsStart then
        -- muted: not interesting
        return
    end

    local jsonStr = raw:sub(jsStart)
    local ok, tbl = pcall(Util.JsonDecode, jsonStr)
    if not ok or type(tbl) ~= "table" then
        -- muted: failed decode
        return
    end

    -- Extract model + config (basename of .pc)
    local model = tbl.jbm or (tbl.vcf and tbl.vcf.model) or "unknown"
    local pcf   = (tbl.vcf and tbl.vcf.partConfigFilename) or ""
    local cfg   = pcf:match("([^/]+)%.pc$") or "custom"

    -- === IGNORE RULES ===
    local action = shouldIgnoreSpawn(model, cfg, tbl)
    if action == "despawn" then
        safeRemoveVehicle(player_id, vehicle_id) -- silent
        return
    elseif action == "mute" then
        -- keep spawned, but NO logs/chat/POST/price
        return
    end

    -- Non-ignored spawns proceed below

    -- Your original debug print (kept for non-ignored spawns):
    print(model .. "  " .. cfg)

    -- ===== Price / Name lookup =====
    local niceName, price, entry = lookupByModelConfig(model, cfg)
    if not niceName then
        -- try parts-set fallback if present in the payload
        local parts = (tbl.vcf and tbl.vcf.parts) or tbl.parts or {}
        niceName, price, entry = lookupByParts(model, parts)
    end

    if niceName then
        local priceStr = "$" .. formatNumber(price or 0)
        local msg = string.format("Spawned: %s — %s", niceName, priceStr)

        -- Get player name
        local playerName = MP.GetPlayerName(player_id) or "Unknown"

        -- Log & whisper to the player who spawned
        print(string.format("[SPAWN] %s | %s → %s | price: %s", tostring(model), tostring(cfg), niceName, priceStr))
        if player_id then
            MP.SendChatMessage(player_id, msg)
        end

        MP.SendChatMessage(player_id, "⌛ Purchase pending… please wait")

        local vehicleCode = generateVehicleCode()

        sendSpawnEvent({
            event = "car_spawn",
            playerId = player_id,
            playerName = playerName,
            vehicleId = vehicle_id,
            model = tostring(model),
            config = tostring(cfg),
            niceName = niceName,
            price = (price or 0),
            configJson = Util.JsonEncode(tbl.vcf),  -- For backend backup
            vehicleCode = vehicleCode
        })

        AddPendingPurchase(player_id, playerName, vehicle_id, model, cfg, tbl, vehicleCode)

    else
        print(string.format("[SPAWN] %s | %s (no verified config match)", tostring(model), tostring(cfg)))
        if player_id then
            MP.SendChatMessage(player_id, string.format("Spawned: %s %s — (no verified price)", tostring(model), tostring(cfg)))
        end
    end
end

--======= EXTRAS =======

-- Helper function to send spawn event to backend using curl
function sendSpawnEvent(eventData)
    local jsonPath = "spawn_event.json"
    local jsonData = Util.JsonEncode(eventData)

    local url = "https://racevault.onrender.com/api/beammp-webhook"
    local cmd = string.format(
        "curl -s -X POST -H "Content-Type: application/json" -d '%s' "%s" -o "%s"",
        jsonData, url, jsonPath
    )
    os.execute(cmd)

    -- Optional response logging
    local f = io.open(jsonPath, "r")
    if f then
        local body = f:read("*a")
        f:close()
        os.remove(jsonPath)
        print("Spawn event POST response:", body)
    else
        print("Failed to send spawn event")
    end
end





