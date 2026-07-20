import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiPhone, FiMapPin, FiLock, FiAward, FiGift, FiCamera, FiTrash2 } from 'react-icons/fi';
import { Spinner } from '../components/Loader';

const Profile = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Address/Phone States
  const [phone, setPhone] = useState('+91 ');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [govIdType, setGovIdType] = useState('None');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [verifiedLoc, setVerifiedLoc] = useState('');
  const [updating, setUpdating] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Referral States
  const [referralInput, setReferralInput] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data.success) {
        setProfile(res.data.data);
        setPhone(res.data.data.phone || '+91 ');
        setStreet(res.data.data.address?.street || '');
        setCity(res.data.data.address?.city || '');
        setState(res.data.data.address?.state || '');
        setZip(res.data.data.address?.zip || '');
        setGovIdType(res.data.data.governmentIdType || 'None');
        setGovIdNumber(res.data.data.governmentIdNumber || '');
        setVerifiedLoc(res.data.data.verifiedLocation || '');
      }
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await api.put('/users/profile', {
        phone,
        street,
        city,
        state,
        zip,
        governmentIdType: govIdType,
        governmentIdNumber: govIdNumber,
        verifiedLocation: verifiedLoc,
      });
      if (res.data.success) {
        toast.success('Profile details submitted for verification!');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    const uploadToast = toast.loading('Uploading avatar photo...');
    try {
      const res = await api.post('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Avatar photo updated!', { id: uploadToast });
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed', { id: uploadToast });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.message || 'Password update failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    setApplyingReferral(true);
    try {
      const res = await api.post('/users/referral', { referralCode: referralInput });
      if (res.data.success) {
        toast.success(res.data.message);
        setReferralInput('');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to apply referral code');
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete your Solar Trade account? This action cannot be undone.')) return;

    try {
      const res = await api.delete('/users/account');
      if (res.data.success) {
        toast.success('Account deleted.');
        logout();
      }
    } catch (err) {
      toast.error('Deactivation failed');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Avatar and Achievements */}
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass text-center relative">
          <div className="relative h-24 w-24 mx-auto rounded-full bg-brand text-white text-3xl font-bold flex items-center justify-center overflow-hidden border-4 border-white shadow-premium">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              profile?.user.name.charAt(0)
            )}
            <label className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
              <FiCamera className="text-white text-lg" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <h3 className="font-bold text-lg mt-3">{profile?.user.name}</h3>
          <p className="text-xs text-slate-400">{profile?.user.email}</p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <span className="inline-block rounded-full bg-brand/5 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
              {profile?.user.role}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${profile?.verificationStatus === 'Verified' ? 'bg-green-150 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                profile?.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/10'
              }`}>
              {profile?.verificationStatus === 'Verified' ? `Verified (${profile?.verifiedLocation || 'India'})` : `Verification: ${profile?.verificationStatus || 'Pending'}`}
            </span>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-4 flex justify-around text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium">REWARDS</p>
              <p className="font-bold text-brand">{profile?.rewardPoints || 0} pts</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">MY REFERRAL</p>
              <p className="font-bold text-brand-emerald">{profile?.referralCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Badges Achievements */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiAward /> Achievements & Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile?.badges && profile.badges.length > 0 ? (
              profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-brand/5 border border-brand/20 px-3 py-1 text-xs font-bold text-brand-dark dark:text-brand-lime"
                >
                  {badge}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Lock in contracts to earn achievements!</span>
            )}
          </div>

          {profile?.achievements && profile.achievements.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-400 uppercase">Unlocked Milestones</p>
              {profile.achievements.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-slate-400 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Account Settings */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact/Address Details */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <FiUser /> Contact Details & Address
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Street Address</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Hno Street, Area"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hyderabad"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Telangana"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Zip Code</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="XXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Govt Identity Verification (India)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">ID Document Type</label>
                  <select
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="None">None</option>
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="VoterID">Voter ID</option>
                    <option value="DriverLicense">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Document Number</label>
                  <input
                    type="text"
                    value={govIdNumber}
                    onChange={(e) => setGovIdNumber(e.target.value)}
                    placeholder="e.g. Aadhaar/PAN number"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">State Location (India)</label>
                  <input
                    type="text"
                    value={verifiedLoc}
                    onChange={(e) => setVerifiedLoc(e.target.value)}
                    placeholder="e.g. Amritsar, Punjab"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="rounded-full bg-brand hover:bg-brand-dark px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {updating ? 'Saving Details...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Change Password & Referral Code boxes in 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <FiLock /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-2xl bg-brand text-white py-2.5 text-xs font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                Save Password
              </button>
            </form>
          </div>

          {/* Referral Code Application */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                <FiGift /> Claim referral reward
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 font-medium">
                Apply a friend's referral code to unlock +50 green reward points instantly.
              </p>
              {profile?.referredBy ? (
                <div className="rounded-2xl bg-brand/5 border border-brand/20 p-3 text-center text-xs font-bold text-brand">
                  Code applied: {profile.referredBy}
                </div>
              ) : (
                <form onSubmit={handleApplyReferral} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="ENTER REF CODE"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    disabled={applyingReferral}
                    className="w-full rounded-2xl bg-brand text-white py-2.5 text-xs font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
                  >
                    Apply Code
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={handleDeleteAccount}
              className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 mt-4 transition-all"
            >
              <FiTrash2 /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
