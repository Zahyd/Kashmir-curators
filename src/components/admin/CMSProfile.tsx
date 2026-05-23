import { useState, useEffect } from 'react';
import { Save, Loader2, User as UserIcon, Shield, Lock, Phone, Mail, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (teamUser) {
      setName(teamUser.name || '');
      setEmail(teamUser.email || '');
      setPhone(teamUser.phone || '');
      setImage(teamUser.image || '');
    }
  }, [teamUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required.');
      return;
    }

    setSavingProfile(true);
    const result = await updateTeamProfile({ name, email, phone, image });
    setSavingProfile(false);

    if (result.success) {
      toast.success('Profile details updated successfully!');
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
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const result = await updateTeamProfile({ password: newPassword });
    setSavingPassword(false);

    if (result.success) {
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">Admin Profile</h2>
        <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Manage Your Security & System Credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Avatar & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
            
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 block">Profile Picture</label>
            
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-kashmir-gold/40">
                {image ? (
                  <img src={image} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-kashmir-gold" />
                )}
              </div>
            </div>

            <div className="w-full">
              <MediaPicker
                value={image}
                onChange={(url) => setImage(url)}
              />
            </div>

            <div className="border-t border-white/5 w-full my-6 pt-6 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/30 uppercase font-black tracking-wider">Employee ID</span>
                <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">{teamUser?.code || 'ADMIN'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/30 uppercase font-black tracking-wider">System Role</span>
                <span className="font-bold text-kashmir-gold tracking-widest uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  {ROLE_LABELS[teamUser?.role || 'admin']}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Section: Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Form 1: General Details */}
          <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
            
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <UserIcon className="h-5 w-5 text-kashmir-gold" />
              Identity Configuration
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Full Name</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-bold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      type="email"
                      className="pl-12 bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@kashmircurators.com"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">WhatsApp / Phone Connection</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      className="pl-12 bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-medium"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  disabled={savingProfile}
                  className="bg-white text-black hover:bg-kashmir-gold hover:text-black font-black px-8 h-12 rounded-xl transition-all duration-300 shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="text-[9px] uppercase tracking-widest">{savingProfile ? 'Saving...' : 'Save Profile Details'}</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Form 2: Password Update */}
          <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
            
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Lock className="h-5 w-5 text-kashmir-gold" />
              Credentials & Security
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">New Password</label>
                  <Input
                    type="password"
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-bold"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Confirm Password</label>
                  <Input
                    type="password"
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-bold"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  disabled={savingPassword}
                  className="bg-white text-black hover:bg-kashmir-gold hover:text-black font-black px-8 h-12 rounded-xl transition-all duration-300 shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {savingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span className="text-[9px] uppercase tracking-widest">{savingPassword ? 'Updating...' : 'Update Gate Credentials'}</span>
                </Button>
              </div>
            </form>
          </Card>

        </div>

      </div>
    </div>
  );
}
