package org.brooks

fun areCardsASet(card1: Card, card2: Card, card3: Card): Boolean {
    return card1.shape.allSameOrAllDifferent(card2.shape, card3.shape) &&
            card1.color.allSameOrAllDifferent(card2.color, card3.color) &&
            card1.fill.allSameOrAllDifferent(card2.fill, card3.fill) &&
            card1.count.allSameOrAllDifferent(card2.count, card3.count)
}

fun CardFaceValue.allSameOrAllDifferent(value2: CardFaceValue, value3: CardFaceValue): Boolean {
    return (this == value2 && value2 == value3) || (this != value2 && value2 != value3 && this != value3)
}

fun main() {
    val dealCards = createHashMap().shuffleAndDeal12()

    // Brute force to find a valid set of three cards
    outer@for (i in 0 until dealCards.size - 2) {
        for (j in i + 1 until dealCards.size - 1) {
            for (k in j + 1 until dealCards.size) {
                val card1 = dealCards[i].value.first
                val card2 = dealCards[j].value.first
                val card3 = dealCards[k].value.first
                if (areCardsASet(card1, card2, card3)) {
                    println("\nFound a valid set: ${card1.toCardStr()}, ${card2.toCardStr()}, ${card3.toCardStr()}")
                    break@outer
                }
            }
        }
    }

    // Example usage to check if three cards are a set
    val card1 = dealCards[0].value.first
    val card2 = dealCards[1].value.first
    val card3 = dealCards[2].value.first
    println("\nAre the selected cards a set? ${areCardsASet(card1, card2, card3)}")
}