// Package syntaxdemo intentionally contains a parse error: it produces a
// "syntax"-source diagnostic ("missing ',' in argument list").
//
// Hover the marked line to see the formatted hover.
package syntaxdemo

import "fmt"

func MissingComma() {
	fmt.Println("hello" "world") // <- Missing comma in argument list
}
