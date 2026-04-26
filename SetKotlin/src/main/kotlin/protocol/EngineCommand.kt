package org.brooks.protocol

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class EngineCommand(
    val command: String,
    val index: Int? = null,
    val initials: String? = null,
)

object CommandNames {
    const val NewGame = "new_game"
    const val GetState = "get_state"
    const val ToggleSelect = "toggle_select"
    const val SubmitSelection = "submit_selection"
    const val DealMore = "deal_more"
    const val ReDeal = "re_deal"
    const val Hint = "hint"
    const val Reset = "reset"
    const val SubmitHighScore = "submit_high_score"
    const val Shutdown = "shutdown"
}

@Serializable
data class CardDto(
    val index: Int,
    val shape: String,
    val color: String,
    val fill: String,
    val count: String,
    val selected: Boolean,
)

@Serializable
data class GameStateDto(
    val board: List<CardDto>,
    val selectedIndexes: List<Int>,
    val remainingCards: Int,
    val foundSets: Int,
    val score: Int,
    val leaderboard: List<LeaderboardEntryDto>,
    val leaderboardPendingEntry: Boolean,
    val status: String,
    val hasAnySetOnBoard: Boolean,
    val gameComplete: Boolean,
    val gameOver: Boolean,
)

@Serializable
data class LeaderboardEntryDto(
    val initials: String,
    val score: Int,
    val achievedAt: String,
)

@Serializable
data class ScoreEventDto(
    val label: String,
    val points: Int,
)

@Serializable
data class SubmissionDto(
    val isSet: Boolean,
    val selectedIndexes: List<Int>,
)

@Serializable
sealed interface EngineResponse {
    val ok: Boolean
    val command: String?
}

@Serializable
@SerialName("state")
data class StateResponse(
    override val ok: Boolean = true,
    override val command: String,
    val state: GameStateDto,
    val message: String? = null,
    val submission: SubmissionDto? = null,
    val hintIndexes: List<Int>? = null,
    val scoreEvents: List<ScoreEventDto>? = null,
) : EngineResponse

@Serializable
@SerialName("error")
data class ErrorResponse(
    override val ok: Boolean = false,
    override val command: String? = null,
    val code: String,
    val message: String,
) : EngineResponse

@Serializable
@SerialName("ack")
data class AckResponse(
    override val ok: Boolean = true,
    override val command: String,
    val message: String,
) : EngineResponse
