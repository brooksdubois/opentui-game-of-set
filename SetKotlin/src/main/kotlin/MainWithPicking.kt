package org.brooks

import org.brooks.engine.BoardPosition
import org.brooks.engine.GameEngine
import org.brooks.engine.GameState
import org.brooks.rendering.CardRenderer
import org.brooks.rendering.toCardStr

fun main() {
    val engine = GameEngine()

    renderBoard(engine.currentState())
    println("Welcome to the Set Game")

    while (true) {
        println("Enter 3 cells (ie. 'a1 b1 c1')")
        val input = readlnOrNull()?.lowercase()

        if (input == null || input == "exit") {
            println("Goodbye!")
            break
        }

        val positions = input.toBoardPositions()
        if (positions == null) {
            println("Invalid input. Please use the format 'a1 b1 c1' or type 'exit' to quit.")
            continue
        }

        try {
            engine.selectCardsAt(positions)
            val submission = engine.submitSelectedSet()
            val selectedCards = submission.selectedCards.map { it.card }

            println("""${selectedCards[0].toCardStr()} |  ${selectedCards[1].toCardStr()}  |  ${selectedCards[2].toCardStr()} """)
            println("Are the selected cards a set?")
            println(if (submission.isSet) "YES" else "NO")

            if (submission.isSet) {
                renderBoard(submission.state)
            }
        } catch (e: IllegalArgumentException) {
            println(e.message)
        } catch (e: IllegalStateException) {
            println(e.message)
        }
    }
}

private fun String.toBoardPositions(): List<BoardPosition>? {
    val cells = trim().split(Regex("\\s+"))
    if (cells.size != 3) return null

    return cells.map { cell ->
        if (cell.length != 2) return null
        val row = cell[0]
        val column = cell[1].digitToIntOrNull() ?: return null
        BoardPosition(row = row, column = column)
    }
}

private fun renderBoard(state: GameState) {
    if (state.board.isEmpty()) {
        println("No cards are currently on the board.")
        return
    }

    print(CardRenderer.renderPlayableCards(state.board))
}
