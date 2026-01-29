import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useIsRouteMigrated } from '@/features/flags'

interface LegacyFrameProps {
  path: string
  className?: string
}

// Messages the legacy app can send to React shell
interface LegacyMessage {
  type: 'NAVIGATE' | 'TITLE_CHANGE' | 'READY' | 'AUTH_REQUIRED'
  path?: string
  title?: string
}

const LEGACY_BASE_URL = import.meta.env.VITE_LEGACY_APP_URL || ''

export function LegacyFrame({ path, className }: LegacyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Build the full legacy URL
  const legacyUrl = `${LEGACY_BASE_URL}/${path}?embedded=true`

  // Handle messages from the legacy app
  const handleMessage = useCallback(
    (event: MessageEvent<LegacyMessage>) => {
      // Security: validate origin
      if (LEGACY_BASE_URL && event.origin !== new URL(LEGACY_BASE_URL).origin) {
        return
      }

      const { type, path: newPath, title } = event.data

      switch (type) {
        case 'NAVIGATE':
          if (newPath) {
            // Check if the target route is migrated
            const basePath = '/' + newPath.split('/')[1] // e.g., /customers/123 -> /customers
            // We can't call hooks here, so we'll navigate and let the router handle it
            navigate({ to: newPath as '/' })
          }
          break

        case 'TITLE_CHANGE':
          if (title) {
            document.title = title
          }
          break

        case 'READY':
          setIsLoading(false)
          break

        case 'AUTH_REQUIRED':
          // Handle authentication - could redirect to login
          console.warn('Legacy app requires authentication')
          navigate({ to: '/' })
          break
      }
    },
    [navigate]
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Handle iframe load
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setError(null)

    // Try to sync document title
    try {
      const iframe = iframeRef.current
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
      if (iframeDoc?.title) {
        document.title = iframeDoc.title
      }
    } catch {
      // Cross-origin restrictions - that's fine
    }
  }, [])

  // Handle iframe error
  const handleError = useCallback(() => {
    setIsLoading(false)
    setError('Failed to load the legacy application')
  }, [])

  return (
    <div className={`legacy-frame-container ${className || ''}`}>
      {isLoading && (
        <div className="legacy-frame-loading">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="legacy-frame-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={legacyUrl}
        className="legacy-frame"
        title="Legacy Application"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: isLoading || error ? 'none' : 'block' }}
      />
    </div>
  )
}

// ============================================================================
// Hook to determine if current path should use legacy frame
// ============================================================================

export function useShouldUseLegacy(path: string): boolean {
  const isMigrated = useIsRouteMigrated(path)
  return !isMigrated
}
