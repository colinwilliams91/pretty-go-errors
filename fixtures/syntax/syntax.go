// Package syntaxdemo intentionally contains parse errors: they produce
// "syntax"-source diagnostics that Pretty Go Errors formats.
//
// Hover the marked lines to see the formatted hovers.
package syntaxdemo

import "fmt"

// Missing ',' in argument list.
func MissingComma() {
	fmt.Println("hello" "world") // <- Missing comma (argument list)
}

// Missing ',' in composite literal.
func MissingCommaInLiteral() {
	vals := []int{1 2 3} // <- Missing comma (composite literal)
	fmt.Println(vals)
}

// Expected operand (dangling assignment right before the closing brace).
func ExpectedOperand() {
	unfinished := // <- Expected operand
}
