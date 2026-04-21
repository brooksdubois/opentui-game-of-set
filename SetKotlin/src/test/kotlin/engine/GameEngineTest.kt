package engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import org.brooks.domain.Card
import org.brooks.domain.DeckFactory
import org.brooks.engine.GameEngine
import org.brooks.engine.GameStatus
import org.brooks.rules.SetEvaluator

class GameEngineTest {
    @Test
    fun dealMoreDrawsFromRemainingDeck() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })
        val before = engine.currentState()

        val result = engine.dealMore()

        assertEquals(3, result.cardsDealt)
        assertEquals(before.board.size + 3, result.state.board.size)
        assertEquals(before.remainingCards - 3, result.state.remainingCards)
        assertBoardHasNoDuplicates(result.state.board)
    }

    @Test
    fun dealMoreStopsWhenDeckIsExhausted() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })

        while (engine.currentState().remainingCards > 0) {
            engine.dealMore()
        }

        val beforeNoOp = engine.currentState()
        val result = engine.dealMore()

        assertEquals(0, result.cardsDealt)
        assertEquals(0, result.state.remainingCards)
        assertEquals(beforeNoOp.board.size, result.state.board.size)
        assertBoardHasNoDuplicates(result.state.board)
    }

    @Test
    fun reDealAddsOnlyUndealtCardsWhenBoardHasNoSet() {
        val noSetBoard = noSetCards(12)
        val deck = noSetBoard + DeckFactory.standardSetDeck().filterNot { it in noSetBoard }
        val engine = GameEngine(deckFactory = { deck })

        assertFalse(engine.currentState().hasAnySetOnBoard)

        val result = engine.reDeal()

        assertTrue(result.redealt)
        assertTrue(result.cardsAdded > 0)
        assertTrue(result.state.hasAnySetOnBoard || result.state.gameComplete)
        assertTrue(result.state.remainingCards < 69)
        assertBoardHasNoDuplicates(result.state.board)
    }

    @Test
    fun reDealIsNoOpWhenBoardAlreadyHasSet() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })
        if (!engine.currentState().hasAnySetOnBoard) {
            engine.dealMore()
        }

        assertTrue(engine.currentState().hasAnySetOnBoard)
        val before = engine.currentState()

        val result = engine.reDeal()

        assertFalse(result.redealt)
        assertEquals(0, result.cardsAdded)
        assertEquals(before.board, result.state.board)
        assertEquals(before.remainingCards, result.state.remainingCards)
    }

    @Test
    fun repeatedValidPlayDoesNotCreateVisibleDuplicates() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })

        repeat(10) {
            val hint = engine.findHint() ?: run {
                engine.reDeal()
                engine.findHint()
            }

            assertNotNull(hint)
            hint.forEach { engine.toggleSelection(it.boardIndex) }

            val submission = engine.submitSelectedSet()

            assertTrue(submission.isSet)
            assertBoardHasNoDuplicates(submission.state.board)
        }
    }

    @Test
    fun gameCompletesWhenDeckIsEmptyAndNoSetExistsInLiveCards() {
        val engine = GameEngine(deckFactory = { noSetCards(12) })
        val state = engine.currentState()

        assertEquals(0, state.remainingCards)
        assertFalse(state.hasAnySetOnBoard)
        assertTrue(state.gameComplete)
        assertEquals(GameStatus.Complete, state.status)
    }

    private fun noSetCards(count: Int): List<Card> {
        val cards = mutableListOf<Card>()

        DeckFactory.standardSetDeck().forEach { card ->
            val candidate = cards + card
            if (!SetEvaluator.hasAnySet(candidate)) {
                cards.add(card)
            }
            if (cards.size == count) return cards
        }

        error("Could not build $count cards without a set")
    }

    private fun assertBoardHasNoDuplicates(cards: List<Card>) {
        assertEquals(cards.size, cards.toSet().size)
    }
}
