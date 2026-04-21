package org.brooks.rules

import org.brooks.domain.Card
import org.brooks.domain.CardFaceValue

object SetEvaluator {
    fun areCardsASet(card1: Card, card2: Card, card3: Card): Boolean =
        card1.shape.allSameOrAllDifferent(card2.shape, card3.shape) &&
            card1.color.allSameOrAllDifferent(card2.color, card3.color) &&
            card1.fill.allSameOrAllDifferent(card2.fill, card3.fill) &&
            card1.count.allSameOrAllDifferent(card2.count, card3.count)

    fun areCardsASet(cards: List<Card>): Boolean {
        require(cards.size == 3) { "Exactly 3 cards are required to evaluate a set" }
        return areCardsASet(cards[0], cards[1], cards[2])
    }

    private fun CardFaceValue.allSameOrAllDifferent(value2: CardFaceValue, value3: CardFaceValue): Boolean =
        (this == value2 && value2 == value3) ||
            (this != value2 && value2 != value3 && this != value3)
}
