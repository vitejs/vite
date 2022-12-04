import msg from '@vitejs/test-added-in-entries'

// This is an entry file that is added to optimizeDeps.entries
// When the deps aren't cached, these entries are also processed
// to discover dependencies in them. This should only be needed
// for code splitted sections that are commonly visited after
// first load where a full-reload wants to be avoided at the expense
// of extra processing on cold start. Another option is to add
// the missing dependencies to optimizeDeps.include directly

console.log(msg)
