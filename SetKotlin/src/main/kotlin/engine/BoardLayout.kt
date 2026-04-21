package org.brooks.engine

data class BoardPosition(
    val row: Char,
    val column: Int,
)

class BoardLayout(
    val rows: Int = 3,
    val columns: Int = 4,
) {
    val boardSize: Int = rows * columns

    fun indexOf(position: BoardPosition): Int = indexOf(position.row, position.column)

    fun indexOf(row: Char, column: Int): Int {
        val rowIndex = row.lowercaseChar() - 'a'
        require(rowIndex in 0 until rows) { "Invalid row: $row" }
        require(column in 1..columns) { "Invalid column: $column" }
        return rowIndex * columns + (column - 1)
    }

    fun positionOf(index: Int): BoardPosition {
        require(index in 0 until boardSize) { "Invalid board index: $index" }
        val row = ('a'.code + (index / columns)).toChar()
        val column = (index % columns) + 1
        return BoardPosition(row = row, column = column)
    }
}
