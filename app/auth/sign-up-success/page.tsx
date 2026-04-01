import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground">
            {"We've"} sent you a confirmation link to verify your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in your email to activate your account and start chatting.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                <MessageCircle className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
