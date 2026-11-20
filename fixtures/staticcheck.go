// Package fixtures compiles cleanly on purpose: Staticcheck analyzers
// (including gopls' bundled SA checks) only run on packages that type-check,
// so the deliberate-error examples live in subdirectories (broken/, syntax/).
//
// Hover each marked line to see the formatted Pretty Go Errors hover.
package fixtures

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"
)

// SA1019 - Using a deprecated function, variable, constant or field.
func DeprecatedAPI() string {
	return strings.Title("hello world") // <- SA1019
}

// SA1004 - Suspiciously small untyped constant in time.Sleep.
// (values 1..120 are flagged; this sleeps for 100 *nanoseconds*)
func Sleepy() {
	time.Sleep(100) // <- SA1004
}

// SA1002 - Invalid format in time.Parse.
// The layout must use the reference time (Mon Jan 2 15:04:05 MST 2006).
func BadLayout() {
	_, _ = time.Parse("2006-01-02", "2024-01-01") // <- SA1002
}

// SA1012 - A nil context.Context is being passed to a function.
func NeedsCtx(ctx context.Context) {}

func NilContext() {
	NeedsCtx(nil) // <- SA1012
}

// SA1032 - Wrong order of arguments to errors.Is.
// The error we HAVE comes first; the sentinel comes second.
var Sentinel = errors.New("sentinel")

func WrongOrder(err error) bool {
	return errors.Is(io.EOF, err) // <- SA1032
}

// SA4017 - Discarding the return value of a function without side effects.
func IgnoredResult() {
	strings.Replace("aaa", "a", "b", 1) // <- SA4017
}

// SA2000 - (*sync.WaitGroup).Add called inside the goroutine.
func Racers() {
	var wg sync.WaitGroup
	go func() {
		wg.Add(1) // <- SA2000 (should be called before `go`)
		defer wg.Done()
	}()
	wg.Wait()
}

// SA5008 - Invalid struct tag (duplicate tag key).
type BadTagged struct {
	A int `json:"a" json:"a"` // <- SA5008 (duplicate struct tag "json")
	B int `json:"b"`
}

// SA9001 - Defers in range loops may not run when you expect them to.
func DeferredInRange(ch chan int) {
	for range ch {
		defer fmt.Println("cleanup") // <- SA9001
	}
}

// SA5007 - Infinite recursive call.
func SpinForever() {
	SpinForever() // <- SA5007
}
