import { useState, useEffect } from 'react';
import { Save, Loader2, User as UserIcon, Shield, Lock, Phone, Mail, Award, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTeamAuth, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';

export default function CMSProfile() {
  const { teamUser, updateTeamProfile } = useTeamAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (teamUser) {
      setName(teamUser.name || 'Zahid Riyaz');
      setEmail(teamUser.email || (teamUser.code === 'ADMIN001' ? 'Zahidreyaz44123@gmail.com' : ''));
      setPhone(teamUser.phone || '+91 91037 98448');
      setImage(teamUser.image || '');
    }
  }, [teamUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!email.trim()) {
      toast.error('Email address is required.');
      return;
    }

    setSavingProfile(true);
    const result = await updateTeamProfile({ 
      name: name.trim(), 
      email: email.trim(), 
      phone: phone.trim(), 
      image 
    });
    setSavingProfile(false);

    if (result.success) {
      toast.success('Personnel profile details updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update profile.');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const result = await updateTeamProfile({ password: newPassword });
    setSavingPassword(false);

    if (result.success) {
      toast.success('Security gate credentials updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[8px] font-black uppercase tracking-wider">
              SECURITY & IDENTITY
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Personnel Profile</h2>
          <p className="text-white/40 text-xs mt-0.5">Manage administrative credentials, verified email & gate security</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-400/10 text-amber-300 border-amber-400/25 px-3 py-1 text-xs font-bold font-mono">
            ID: {teamUser?.code || 'ADMIN001'}
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs font-bold">
            {ROLE_LABELS[teamUser?.role || 'admin']}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Verification Capsule */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#0a0f14]/80 border border-white/10 p-6 rounded-2xl backdrop-blur-xl flex flex-col items-center text-center shadow-xl">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 block">Executive Emblem</label>
            
            <div className="relative group mb-5">
              <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-amber-400/40">
                {image ? (
                  <img src={image} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-amber-400" />
                )}
              </div>
            </div>

            <div className="w-full">
              <MediaPicker
                value={image}
                onChange={(url) => setImage(url)}
              />
            </div>

            <div className="border-t border-white/5 w-full my-5 pt-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase font-bold text-[10px] tracking-wider">Employee ID</span>
                <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">{teamUser?.code || 'ADMIN001'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase font-bold text-[10px] tracking-wider">System Role</span>
                <span className="font-bold text-amber-300 tracking-wider text-xs flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  {ROLE_LABELS[teamUser?.role || 'admin']}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase font-bold text-[10px] tracking-wider">Verified State</span>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Director
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form 1: Identity & Contact Configuration */}
          <Card className="bg-[#0a0f14]/80 border border-white/10 p-6 sm:p-8 rounded-2xl backdrop-blur-xl shadow-xl">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
              <UserIcon className="h-5 w-5 text-amber-400" />
              <span>Identity & Contact Details</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Full Legal Name</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-white placeholder-white/20 focus:border-amber-400/50 transition-all font-medium text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      className="pl-10 bg-white/5 border-white/10 rounded-xl h-11 text-white placeholder-white/20 focus:border-amber-400/50 transition-all font-medium text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@thekashmircurators.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">WhatsApp / Phone Line</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      className="pl-10 bg-white/5 border-white/10 rounded-xl h-11 text-white placeholder-white/20 focus:border-amber-400/50 transition-all font-medium text-sm"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 91037 98448"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit"
                  disabled={savingProfile}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:opacity-95 font-bold px-6 h-11 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2 text-xs"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{savingProfile ? 'Saving Details...' : 'Save Profile Details'}</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Form 2: Security & Password Update */}
          <Card className="bg-[#0a0f14]/80 border border-white/10 p-6 sm:p-8 rounded-2xl backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-400" />
                <span>Security Gate Credentials</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-white/40 hover:text-white flex items-center gap-1.5"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">New Gate Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-white placeholder-white/20 focus:border-amber-400/50 transition-all font-mono text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Confirm New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-white placeholder-white/20 focus:border-amber-400/50 transition-all font-mono text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit"
                  disabled={savingPassword}
                  className="bg-white/[0.06] border border-white/15 text-white hover:bg-white/[0.12] font-bold px-6 h-11 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-xs"
                >
                  {savingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 text-amber-400" />
                  )}
                  <span>{savingPassword ? 'Updating Password...' : 'Update Gate Credentials'}</span>
                </Button>
              </div>
            </form>
          </Card>

        </div>

      </div>
    </div>
  );
}
