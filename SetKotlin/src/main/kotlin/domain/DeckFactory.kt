package org.brooks.domain

object DeckFactory {
    fun standardSetDeck(): List<Card> =
        Shapes.getShapes().flatMap { shape ->
            Counts.getCounts().flatMap { count ->
                Fills.getFills().flatMap { fill ->
                    Colors.getColors().map { color ->
                        Card(shape = shape, color = color, fill = fill, count = count)
                    }
                }
            }
        }
}
