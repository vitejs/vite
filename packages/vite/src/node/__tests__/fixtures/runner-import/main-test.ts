// This file tests import.meta.main functionality
import { dep } from './main-test-dep'

export const isMainModule = import.meta.main
export const depIsMainModule = dep.isMainModule

// Basic test to ensure it exports something
export const value = 'main'
