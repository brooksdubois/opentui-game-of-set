package org.brooks.engine

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

interface LeaderboardStore {
    fun load(): List<LeaderboardEntry>

    fun save(entries: List<LeaderboardEntry>)
}

@Serializable
data class LeaderboardEntry(
    val initials: String,
    val score: Int,
    val achievedAt: String,
)

class FileLeaderboardStore(
    private val path: Path = defaultLeaderboardPath(),
    private val json: Json = Json {
        encodeDefaults = true
        explicitNulls = false
        ignoreUnknownKeys = true
    },
) : LeaderboardStore {
    override fun load(): List<LeaderboardEntry> {
        if (!Files.exists(path)) return emptyList()

        return try {
            val parsed = json.decodeFromString(LeaderboardFile.serializer(), Files.readString(path))
            parsed.entries.filter { it.initials.length == 3 }
        } catch (_: Exception) {
            emptyList()
        }
    }

    override fun save(entries: List<LeaderboardEntry>) {
        val parent = path.parent
        if (parent != null) {
            Files.createDirectories(parent)
        }
        Files.writeString(
            path,
            json.encodeToString(LeaderboardFile.serializer(), LeaderboardFile(entries = entries)),
        )
    }

}

@Serializable
private data class LeaderboardFile(
    val version: Int = 1,
    val entries: List<LeaderboardEntry>,
)

private fun defaultLeaderboardPath(): Path {
    val envPath = System.getenv("SET_SCOREBOARD_PATH")?.trim().orEmpty()
    if (envPath.isNotEmpty()) return Paths.get(envPath)
    return Paths.get(System.getProperty("user.dir"), ".set-high-scores.json")
}
