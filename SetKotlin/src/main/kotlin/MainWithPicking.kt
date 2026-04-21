package org.brooks

class GridAccessor(private val rows: Int, private val cols: Int) {
    private val grid = Array(rows * cols) { "Item-${it + 1}" }

    fun indexOf(row: Char, col: Int): Int {
        val rowIndex = row.lowercaseChar() - 'a'
        require(rowIndex in 0 until rows) { "Invalid row: $row" }
        require(col in 1..cols) { "Invalid column: $col" }
        return rowIndex * cols + (col - 1)
    }

    operator fun get(row: Char, col: Int): String {
        val index = indexOf(row, col)
        return grid[index]
    }
}

fun main(){
    val cardsHash = createHashMap()
    val cards = cardsHash.entries.shuffled().toMutableList()
    var cardsDealt = cards.take(12)

    print(
        dealPlayableCards(
            cardsDealt.map{
                val card = it.value.first
                getAsciiCard(card)
            }
        )
    )

    println("Welcome to the Set Game")
    val grid = GridAccessor(rows = 3, cols = 4)

    while (true) {
        println("Enter 3 cells (ie. 'a1 b1 c1')")
        val input = readlnOrNull()?.lowercase()

        if (input == "exit") {
            println("Goodbye!")
            break
        }

        if (input != null && input.length == 8) {
            val row1 = input.first()
            val col1 = input.substring(1, 2).toInt()
            val card1index = grid.indexOf(row1, col1)
            val row2 = input.substring(3,4).first()
            val col2 = input.substring(4,5).toInt()
            val card2index = grid.indexOf(row2, col2)
            val row3 = input.substring(6,7).first()
            val col3 = input.substring(7,8).toInt()
            val card3index = grid.indexOf(row3, col3)

            try {
                val card1 = cardsDealt[card1index].value
                val card2 = cardsDealt[card2index].value
                val card3 = cardsDealt[card3index].value
                println("""${card1.second} |  ${card2.second}  |  ${card3.second} """)
                println("Are the selected cards a set?")
                val setEval = areCardsASet(card1.first, card2.first, card3.first)
                println(if(setEval) "YES" else "NO")
                if(setEval){
                    cards[card1index] = cards[12]
                    cards.removeAt(12)
                    cards[card2index] = cards[13]
                    cards.removeAt(13)
                    cards[card3index] = cards[14]
                    cards.removeAt(14)

                    cardsDealt = cards.take(12)
                    print(
                        dealPlayableCards(
                            cardsDealt.map{
                                val card = it.value.first
                                getAsciiCard(card)
                            }
                        )
                    )
                }
            } catch (e: IllegalArgumentException) {
                println(e.message)
            }
        } else {
            println("Invalid input. Please use the format 'a2' or type 'exit' to quit.")
        }
    }
}