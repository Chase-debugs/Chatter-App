'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatContext } from '@/components/chat/chat-provider'
import { UserAvatar } from '@/components/chat/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Camera, Loader2, Check, User } from 'lucide-react'

export default function SettingsPage() {
  const { currentUser } = useChatContext()
  const [displayName, setDisplayName] = useState(currentUser.display_name)
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setAvatarUrl(data.url)
      setMessage({ type: 'success', text: 'Avatar uploaded! Click Save to apply changes.' })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Failed to upload image' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .eq('id', currentUser.id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } else {
      setMessage({ type: 'success', text: 'Settings saved! Refresh to see changes.' })
    }

    setSaving(false)
  }

  const hasChanges =
    displayName !== currentUser.display_name || avatarUrl !== currentUser.avatar_url

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-border">
        <Settings className="w-5 h-5 text-muted-foreground mr-2" />
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Manage your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <UserAvatar
                    src={avatarUrl}
                    fallback={displayName}
                    size="lg"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-foreground">{currentUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the camera icon to change your avatar
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs font-bold uppercase text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="bg-input border-border"
                  maxLength={32}
                />
                <p className="text-xs text-muted-foreground">
                  This is how others will see you in chats
                </p>
              </div>

              {/* Username (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  value={currentUser.username}
                  disabled
                  className="bg-muted border-border text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Usernames cannot be changed
                </p>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                    message.type === 'success'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-destructive/20 text-destructive'
                  }`}
                >
                  {message.type === 'success' && <Check className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Account</CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">Member since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentUser.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
