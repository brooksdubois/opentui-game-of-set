package org.brooks.adapter

import java.io.PrintStream
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.brooks.domain.Card
import org.brooks.engine.GameEngine
import org.brooks.engine.GameState
import org.brooks.protocol.AckResponse
import org.brooks.protocol.CardDto
import org.brooks.protocol.CommandNames
import org.brooks.protocol.EngineCommand
import org.brooks.protocol.EngineResponse
import org.brooks.protocol.ErrorResponse
import org.brooks.protocol.GameStateDto
import org.brooks.protocol.StateResponse
import org.brooks.protocol.SubmissionDto

class JsonAdapter(
    private val engine: GameEngine = GameEngine(),
    private val json: Json = Json {
        classDiscriminator = "type"
        encodeDefaults = true
        explicitNulls = false
        ignoreUnknownKeys = true
    },
) {
    fun run(
        input: Sequence<String> = generateSequence(::readlnOrNull),
        output: PrintStream = System.out,
    ) {
        for (line in input) {
            val trimmedLine = line.trim()
            if (trimmedLine.isEmpty()) continue

            val response = handleLine(trimmedLine)
            output.println(json.encodeToString(EngineResponse.serializer(), response))
            output.flush()

            if (response is AckResponse && response.command == CommandNames.Shutdown) {
                break
            }
        }
    }

    fun handleLine(line: String): EngineResponse {
        val command = try {
            json.decodeFromString(EngineCommand.serializer(), line)
        } catch (error: SerializationException) {
            return ErrorResponse(
                code = "invalid_json",
                message = error.message ?: "Malformed JSON command",
            )
        } catch (error: IllegalArgumentException) {
            return ErrorResponse(
                code = "invalid_json",
                message = error.message ?: "Malformed JSON command",
            )
        }

        return handleCommand(command)
    }

    private fun handleCommand(command: EngineCommand): EngineResponse =
        try {
            when (command.command) {
                CommandNames.NewGame,
                CommandNames.Reset,
                -> StateResponse(
                    command = command.command,
                    state = engine.reset().toDto(),
                    message = "game reset",
                )

                CommandNames.GetState -> StateResponse(
                    command = command.command,
                    state = engine.currentState().toDto(),
                )

                CommandNames.ToggleSelect -> {
                    val index = command.index
                        ?: return missingField(command.command, "index")
                    StateResponse(
                        command = command.command,
                        state = engine.toggleSelection(index).toDto(),
                    )
                }

                CommandNames.SubmitSelection -> {
                    val submission = engine.submitSelectedSet()
                    StateResponse(
                        command = command.command,
                        state = submission.state.toDto(),
                        submission = SubmissionDto(
                            isSet = submission.isSet,
                            selectedIndexes = submission.selectedCards.map { it.boardIndex },
                        ),
                    )
                }

                CommandNames.Hint -> {
                    val hintIndexes = engine.findHint()?.map { it.boardIndex } ?: emptyList()
                    StateResponse(
                        command = command.command,
                        state = engine.currentState().toDto(),
                        hintIndexes = hintIndexes,
                        message = if (hintIndexes.isEmpty()) "no set found on board" else "hint found",
                    )
                }

                CommandNames.DealMore -> {
                    val result = engine.dealMore()
                    StateResponse(
                        command = command.command,
                        state = result.state.toDto(),
                        message = result.message(),
                    )
                }

                CommandNames.ReDeal -> {
                    val result = engine.reDeal()
                    StateResponse(
                        command = command.command,
                        state = result.state.toDto(),
                        message = result.message,
                    )
                }

                CommandNames.Shutdown -> AckResponse(
                    command = command.command,
                    message = "shutdown",
                )

                else -> ErrorResponse(
                    command = command.command,
                    code = "unknown_command",
                    message = "Unknown command: ${command.command}",
                )
            }
        } catch (error: IllegalArgumentException) {
            ErrorResponse(
                command = command.command,
                code = "invalid_command",
                message = error.message ?: "Invalid command",
            )
        } catch (error: IllegalStateException) {
            ErrorResponse(
                command = command.command,
                code = "invalid_state",
                message = error.message ?: "Invalid game state",
            )
        }

    private fun missingField(command: String, fieldName: String): ErrorResponse =
        ErrorResponse(
            command = command,
            code = "missing_field",
            message = "Missing required field: $fieldName",
        )

    private fun org.brooks.engine.DealMoreResult.message(): String =
        when {
            cardsDealt > 0 -> "dealt $cardsDealt cards"
            state.gameComplete -> "no set found on 15-card board"
            state.board.size >= 15 -> "15-card board limit reached"
            else -> "no undealt cards remain"
        }

    private fun GameState.toDto(): GameStateDto {
        val selectedIndexes = selectedCards.map { it.boardIndex }
        val selectedSet = selectedIndexes.toSet()

        return GameStateDto(
            board = board.mapIndexed { index, card -> card.toDto(index, index in selectedSet) },
            selectedIndexes = selectedIndexes,
            remainingCards = remainingCards,
            foundSets = foundSets,
            status = status.name.lowercase(),
            hasAnySetOnBoard = hasAnySetOnBoard,
            gameComplete = gameComplete,
            gameOver = gameComplete,
        )
    }

    private fun Card.toDto(index: Int, selected: Boolean): CardDto =
        CardDto(
            index = index,
            shape = shape,
            color = color,
            fill = fill,
            count = count,
            selected = selected,
        )
}
