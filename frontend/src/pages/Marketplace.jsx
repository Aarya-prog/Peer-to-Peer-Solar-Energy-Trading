import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiShoppingBag, FiActivity, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [trades, setTrades] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('P2P'); // 'P2P' or 'Plants'
  const [loading, setLoading] = useState(true);

  // Buy States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeListing, setActiveListing] = useState(null);
  const [activePlant, setActivePlant] = useState(null);
  const [purchaseUnits, setPurchaseUnits] = useState('100');
  const [paying, setPaying] = useState(false);

  // Card states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Filter States
  const [maxPrice, setMaxPrice] = useState('');
  const [minUnits, setMinUnits] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.length > 0 ? parts.join(' ') : val);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(val);
  };

  const fetchMarketplaceData = async () => {
    try {
      const listRes = await api.get(`/marketplace/listings?maxPrice=${maxPrice}&minUnits=${minUnits}`);
      const tradeRes = await api.get('/marketplace/trades');
      const projRes = await api.get('/investments/projects');
      const profileRes = await api.get('/users/profile');

      if (listRes.data.success) setListings(listRes.data.data);
      if (tradeRes.data.success) setTrades(tradeRes.data.data);
      if (projRes.data.success) {
        // filter for active/operational solar fields
        setProjects(projRes.data.data.filter(p => p.status === 'Operational'));
      }
      if (profileRes.data.success) {
        setUserProfile(profileRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, [maxPrice, minUnits]);

  const openCheckout = (list) => {
    setActivePlant(null);
    setActiveListing(list);
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCheckoutModalOpen(true);
  };

  const openPlantCheckout = (plant) => {
    setActiveListing(null);
    setActivePlant(plant);
    setPurchaseUnits('100');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCheckoutModalOpen(true);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    if (!activeListing) return;

    setPaying(true);
    try {
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: activeListing.totalAmount,
        type: 'EnergyTrade',
        referenceId: activeListing._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway initiation failed');
      const { checkoutId, signature } = intentRes.data.data;

      const buyRes = await api.post(`/marketplace/buy/${activeListing._id}`);
      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: 'Card',
      });

      if (buyRes.data.success && verifyRes.data.success) {
        toast.success(`Successfully bought ${activeListing.unitsKwh} kWh of solar energy!`);
        setCheckoutModalOpen(false);
        fetchMarketplaceData();
      }
    } catch (err) {
      toast.error(err.message || 'Purchase failed');
    } finally {
      setPaying(false);
    }
  };

  const handlePlantBuy = async (e) => {
    e.preventDefault();
    if (!activePlant) return;

    const units = parseFloat(purchaseUnits);
    if (isNaN(units) || units <= 0) {
      toast.error('Please input valid energy units');
      return;
    }

    const totalCost = units * 6.5; // standard grid plant rate of 6.5 INR/kWh
    setPaying(true);
    try {
      const intentRes = await api.post('/billing/payments/create-intent', {
        amount: totalCost,
        type: 'Bill',
        referenceId: activePlant._id,
      });

      if (!intentRes.data.success) throw new Error('Gateway initiation failed');
      const { checkoutId, signature } = intentRes.data.data;

      const verifyRes = await api.post('/billing/payments/verify-signature', {
        checkoutId,
        signature,
        paymentMethod: 'Card',
      });

      if (verifyRes.data.success) {
        await api.post('/marketplace/buy-direct', {
          plantId: activePlant._id,
          unitsKwh: units,
          ratePerUnit: 6.5,
          totalAmount: totalCost,
        });

        toast.success(`Successfully purchased ${units} kWh of direct solar generation from ${activePlant.name}!`);
        setCheckoutModalOpen(false);
        fetchMarketplaceData();
      }
    } catch (err) {
      toast.error(err.message || 'Purchase failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Spinner />;

  // Quick distance helper to suggest nearby plants
  const isNearby = (plantLocation) => {
    if (!userProfile?.verifiedLocation) return false;
    const userCity = userProfile.verifiedLocation.split(',')[0].trim().toLowerCase();
    const plantCity = plantLocation.split(',')[0].trim().toLowerCase();
    return userCity === plantCity;
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grid Energy & P2P Marketplace</h2>
          <p className="text-sm text-slate-400 mt-1">Buy clean energy directly from residential generators or verified regional solar fields.</p>
        </div>
        <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('P2P')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'P2P'
                ? 'bg-brand text-white shadow-md shadow-green-500/20'
                : 'text-slate-500 hover:text-slate-750'
            }`}
          >
            Neighborhood P2P
          </button>
          <button
            onClick={() => setActiveTab('Plants')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'Plants'
                ? 'bg-brand text-white shadow-md shadow-green-500/20'
                : 'text-slate-500 hover:text-slate-750'
            }`}
          >
            Direct Solar Plants
          </button>
        </div>
      </div>

      {activeTab === 'P2P' ? (
        /* P2P Tab Layout */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Filter Side */}
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold">Search & Filters</h3>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">MAX PRICE PER UNIT (₹/kWh)</label>
              <input
                type="number"
                step="0.1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 8"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">MINIMUM POWER UNITS (kWh)</label>
              <input
                type="number"
                value={minUnits}
                onChange={(e) => setMinUnits(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Right Listings Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.length === 0 ? (
              <div className="sm:col-span-2 glass-panel p-10 text-center text-slate-400 rounded-3xl">
                No active surplus energy listings matching criteria.
              </div>
            ) : (
              listings.map((list) => (
                <div key={list._id} className="glass-panel p-5 rounded-3xl shadow-glass flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-400 font-semibold">Seller: {list.seller?.name}</p>
                      <span className="rounded-full bg-brand/5 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand-dark dark:text-brand-lime">
                        Active
                      </span>
                    </div>
                    <p className="text-2xl font-black">{list.unitsKwh} kWh</p>
                    <p className="text-xs text-slate-400 mt-1">Rate: <span className="font-bold text-brand">₹{list.pricePerUnit}/kWh</span></p>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">TOTAL COST</p>
                      <p className="font-bold text-sm">₹{list.totalAmount.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => openCheckout(list)}
                      className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-dark transition-all"
                    >
                      Buy Energy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Direct Solar Plants Tab Layout */
        <div className="space-y-6">
          <div className="p-4 bg-brand/5 border border-brand/20 rounded-3xl text-xs text-slate-500 flex items-center gap-2">
            <span>💡</span>
            <span>
              Direct Solar purchases buy energy directly from utility-scale solar farms at a standard rate of <strong>₹6.50 / kWh</strong>. 
              {userProfile?.verifiedLocation ? ` Showing closest verified plants in: ${userProfile.verifiedLocation}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              const isNearbyPlant = isNearby(p.location);
              return (
                <div key={p._id} className={`glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between border ${
                  isNearbyPlant ? 'border-brand-emerald shadow-premium' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <FiMapPin /> {p.location}
                        </p>
                      </div>
                      {isNearbyPlant && (
                        <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <FiCheckCircle /> Nearby Plant
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-550 dark:text-slate-400 line-clamp-3 mb-4">{p.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-slate-400 font-medium">Generation Capacity</p>
                        <p className="font-bold">{p.energyGeneratedMwh || 120} MWh</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Standard Rate</p>
                        <p className="font-bold text-brand">₹6.50 / kWh</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => openPlantCheckout(p)}
                      className={`w-full text-center rounded-2xl py-2.5 text-xs font-bold transition-all shadow-md ${
                        isNearbyPlant 
                          ? 'bg-brand text-white hover:bg-brand-dark shadow-green-500/25' 
                          : 'bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Buy Direct Power
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trade history logs */}
      <div className="glass-panel rounded-3xl shadow-glass overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiActivity /> Trading Ledger & Commission Logs
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
              <th className="px-6 py-4">Transaction Date</th>
              <th className="px-6 py-4">Seller / Plant</th>
              <th className="px-6 py-4">Buyer</th>
              <th className="px-6 py-4">Volume</th>
              <th className="px-6 py-4">Total Payout</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {trades.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400">No trading transaction ledger logs.</td>
              </tr>
            ) : (
              trades.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold">{t.seller?.name || 'Local Grid Project'}</td>
                  <td className="px-6 py-4">{t.buyer?.name || <span className="text-slate-400">Waiting for buyer</span>}</td>
                  <td className="px-6 py-4">{t.unitsKwh} kWh</td>
                  <td className="px-6 py-4 font-bold">₹{t.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-xs font-bold">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Buy Checkout modal */}
      <Modal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="SolarPay Secure Checkout">
        {activeListing && (
          <form onSubmit={handleBuy} className="space-y-4">
            <div className="rounded-2xl bg-brand/5 border border-brand/20 p-4 text-center">
              <p className="text-xs text-slate-400 font-medium">GRID SECURE CHECKOUT AMOUNT</p>
              <p className="text-3xl font-black text-brand">₹{activeListing.totalAmount.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Buying: {activeListing.unitsKwh} kWh from {activeListing.seller?.name}</p>
            </div>

            {/* Animated Credit Card Mockup */}
            <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-brand-emerald to-brand text-white p-5 shadow-premium overflow-hidden mb-6 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-200 tracking-widest font-semibold uppercase">SolarPay Gateway</p>
                  <div className="h-6 w-9 bg-yellow-400/90 rounded-md mt-2 flex items-center justify-center text-[8px] font-bold border border-yellow-350 shadow-sm pointer-events-none text-slate-800">CHIP</div>
                </div>
                <p className="text-sm font-black italic tracking-wider">SOLAR TRADE</p>
              </div>
              <div>
                <p className="text-lg font-mono tracking-widest text-center my-1 select-all">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>
                <div className="flex justify-between items-center text-[9px] text-slate-200 mt-1 font-mono">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-slate-350">Cardholder</p>
                    <p className="font-bold text-xs uppercase truncate max-w-[150px]">{cardName || 'YOUR FULL NAME'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-350">Expires</p>
                      <p className="font-bold text-xs">{cardExpiry || 'MM/YY'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-350">CVV</p>
                      <p className="font-bold text-xs">{cardCvv || '•••'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Expiration</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    required
                    value={cardCvv}
                    onChange={handleCvvChange}
                    maxLength="3"
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={paying}
              className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
            >
              {paying ? 'Authorizing P2P checkout...' : 'Complete Secure Purchase'}
            </button>
          </form>
        )}

        {activePlant && (
          <form onSubmit={handlePlantBuy} className="space-y-4">
            <div className="rounded-2xl bg-brand/5 border border-brand/20 p-4 text-center">
              <p className="text-xs text-slate-400 font-medium">DIRECT SOLAR GENERATION CHECKOUT</p>
              <p className="text-3xl font-black text-brand">₹{(parseFloat(purchaseUnits || '0') * 6.5).toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Buying from: {activePlant.name} ({activePlant.location})</p>
            </div>

            {/* Animated Credit Card Mockup */}
            <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-brand-emerald to-brand text-white p-5 shadow-premium overflow-hidden mb-6 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-200 tracking-widest font-semibold uppercase">SolarPay Gateway</p>
                  <div className="h-6 w-9 bg-yellow-400/90 rounded-md mt-2 flex items-center justify-center text-[8px] font-bold border border-yellow-350 shadow-sm pointer-events-none text-slate-800">CHIP</div>
                </div>
                <p className="text-sm font-black italic tracking-wider">SOLAR TRADE</p>
              </div>
              <div>
                <p className="text-lg font-mono tracking-widest text-center my-1 select-all">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>
                <div className="flex justify-between items-center text-[9px] text-slate-200 mt-1 font-mono">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-slate-350">Cardholder</p>
                    <p className="font-bold text-xs uppercase truncate max-w-[150px]">{cardName || 'YOUR FULL NAME'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-350">Expires</p>
                      <p className="font-bold text-xs">{cardExpiry || 'MM/YY'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-350">CVV</p>
                      <p className="font-bold text-xs">{cardCvv || '•••'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">ENERGY UNITS TO BUY (kWh)</label>
                <input
                  type="number"
                  required
                  value={purchaseUnits}
                  onChange={(e) => setPurchaseUnits(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Expiration</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    required
                    value={cardCvv}
                    onChange={handleCvvChange}
                    maxLength="3"
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={paying}
              className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3.5 text-sm font-semibold text-white transition-all shadow-lg"
            >
              {paying ? 'Authorizing Direct Grid Payout...' : 'Complete Secure Purchase'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Marketplace;
