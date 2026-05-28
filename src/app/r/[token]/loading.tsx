import { LoadingOverlay } from '@/components/loading-overlay'

export default function RegistrationLoading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-6">
      <LoadingOverlay label="読み込み中" />
    </div>
  )
}
