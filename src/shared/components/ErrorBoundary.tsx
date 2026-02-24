import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'monospace',
          color: 'hsl(var(--h), var(--s), var(--l))',
        }}>
          <p>something broke. refresh to try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}
