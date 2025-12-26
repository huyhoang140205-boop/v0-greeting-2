import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              {params?.error ? (
                <p className="text-sm text-red-800">Error: {params.error}</p>
              ) : (
                <p className="text-sm text-red-800">An authentication error occurred. Please try again.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
