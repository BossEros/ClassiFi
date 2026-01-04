
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Input } from './Input'
import React from 'react'

describe('Input Component', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders correctly', () => {
    render(<Input placeholder="Test Input" />)
    const input = screen.getByPlaceholderText('Test Input')
    expect(input).toBeDefined()
  })

  it('applies hasError styling and aria-invalid', () => {
    render(<Input placeholder="Error Input" hasError={true} />)
    const input = screen.getByPlaceholderText('Error Input')

    // Check if aria-invalid is set to true
    expect(input.getAttribute('aria-invalid')).toBe('true')

    // Check if the class list contains error styling
    const className = input.className
    expect(className).toContain('border-red-500')
  })
})
