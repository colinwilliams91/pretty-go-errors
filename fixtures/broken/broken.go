// Package broken intentionally does NOT compile: every marked line produces
// an older compiler diagnostic that Pretty Go Errors already formats.
//
// Hover each marked line to see the formatted hover.
package broken

import "fmt"

func Broken() {
	// Type mismatch ("cannot use ... as ... value").
	var count int = "not a number" // <- Type mismatch
	_ = count

	// Unused local variable ("declared and not used").
	unused := 42 // <- Unused variable

	// Assignment mismatch (2 variables but one() returns 1 value).
	a, b := one() // <- Assignment mismatch
	_ = a
	_ = b

	// Too many arguments in call to greet.
	fmt.Println(greet("world", "extra")) // <- Too many arguments

	// Undefined identifier.
	fmt.Println(ghostVariable) // <- Undefined
}

func one() int { return 1 }

func greet(name string) string { return "hello " + name }
