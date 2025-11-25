'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Bell, 
  Globe, 
  Users,
  Loader2,
  Key,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function PrivacySecurityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Privacy Settings
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowTags, setAllowTags] = useState(true);
  
  // Security Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [reactionNotifications, setReactionNotifications] = useState(true);

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Privacy & Security</h1>
        <p className="text-muted-foreground mt-2">
          Manage your privacy settings and account security
        </p>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#854cf4]" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control who can see your information and interact with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base mb-3 block">Profile Visibility</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    checked={profileVisibility === 'public'}
                    onChange={() => setProfileVisibility('public')}
                    className="w-4 h-4 text-[#854cf4]"
                  />
                  <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone can view your profile</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="connections"
                    name="visibility"
                    checked={profileVisibility === 'connections'}
                    onChange={() => setProfileVisibility('connections')}
                    className="w-4 h-4 text-[#854cf4]"
                  />
                  <Label htmlFor="connections" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Connections Only</div>
                      <div className="text-xs text-muted-foreground">Only your connections can view your profile</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    checked={profileVisibility === 'private'}
                    onChange={() => setProfileVisibility('private')}
                    className="w-4 h-4 text-[#854cf4]"
                  />
                  <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can view your profile</div>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-email">Show Email Address</Label>
                <p className="text-xs text-muted-foreground">Display your email on your profile</p>
              </div>
              <Switch
                id="show-email"
                checked={showEmail}
                onCheckedChange={setShowEmail}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-phone">Show Phone Number</Label>
                <p className="text-xs text-muted-foreground">Display your phone number on your profile</p>
              </div>
              <Switch
                id="show-phone"
                checked={showPhone}
                onCheckedChange={setShowPhone}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-messages">Allow Messages</Label>
                <p className="text-xs text-muted-foreground">Let others send you direct messages</p>
              </div>
              <Switch
                id="allow-messages"
                checked={allowMessages}
                onCheckedChange={setAllowMessages}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-tags">Allow Tagging</Label>
                <p className="text-xs text-muted-foreground">Let others tag you in posts and comments</p>
              </div>
              <Switch
                id="allow-tags"
                checked={allowTags}
                onCheckedChange={setAllowTags}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSavePrivacy}
              disabled={isLoading}
              className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Privacy Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#854cf4]" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Protect your account with strong security measures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch
              id="two-factor"
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          <Separator />

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-base mb-3 block flex items-center gap-2">
                <Key className="w-4 h-4" />
                Change Password
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#854cf4]" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="message-notifications">Message Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when you receive new messages</p>
            </div>
            <Switch
              id="message-notifications"
              checked={messageNotifications}
              onCheckedChange={setMessageNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reaction-notifications">Reaction Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when someone reacts to your posts</p>
            </div>
            <Switch
              id="reaction-notifications"
              checked={reactionNotifications}
              onCheckedChange={setReactionNotifications}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveNotifications}
              disabled={isLoading}
              className="bg-[#854cf4] hover:bg-[#7743e0] text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Delete Account</Label>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
