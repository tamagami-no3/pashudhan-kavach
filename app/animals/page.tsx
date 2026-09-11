'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  HeartPulse,
  PlusCircle,
  QrCode,
  Search,
  Filter,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MAHARASHTRA_DISTRICTS } from '@/lib/constants/districts';
import { toast } from 'sonner';
import { REGISTRY_ROLES } from '@/lib/role-features';

export default function AnimalsPage() {
  const { user, loading: authLoading, t } = useAuth();
  const router = useRouter();

  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form State for new animal
  const [tagUid, setTagUid] = useState('');
  const [species, setSpecies] = useState('Cattle');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('Female');
  const [dob, setDob] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Route guard: Livestock Registry is farmer/paravet ONLY (locked RBAC spec)
    if (user && !REGISTRY_ROLES.includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      fetchAnimals();
      setDistrict(user.district || 'Pune');
    }
  }, [user, authLoading, router]);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      let url = '/api/animals?limit=50';
      if (speciesFilter) url += `&species=${encodeURIComponent(speciesFilter)}`;
      if (districtFilter) url += `&district=${encodeURIComponent(districtFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setAnimals(d.data || []);
      }
    } catch (e) {
      console.warn('Error fetching animals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagUid) {
      toast.error('EAR TAG UID is required');
      return;
    }

    setSubmitting(true);
    try {
      // Pick district centroid lat/lng
      const distObj = MAHARASHTRA_DISTRICTS.find((d) => d.name === district) || MAHARASHTRA_DISTRICTS[0];

      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag_uid: tagUid,
          species,
          breed,
          sex,
          date_of_birth: dob || null,
          gps_lat: distObj.lat,
          gps_lng: distObj.lng,
          village: village || user?.village || 'Unknown Village',
          district: district || user?.district || 'Pune',
          owner_name: user?.full_name || 'Registered Farmer',
          health_status: 'healthy',
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toast.error(d.error?.message || 'Registration failed');
        return;
      }

      toast.success('Livestock registered and QR Health Passport generated!');
      setIsRegisterOpen(false);
      // Reset form
      setTagUid('');
      setBreed('');
      fetchAnimals();
    } catch (err: any) {
      toast.error(err.message || 'Error creating animal');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAnimals = animals.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.tag_uid.toLowerCase().includes(q) ||
      a.species.toLowerCase().includes(q) ||
      a.breed.toLowerCase().includes(q) ||
      a.village.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <HeartPulse className="h-6 w-6 text-emerald-600" />
              {t('nav_animals')} & {t('animals_registry')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('animals_desc')}
            </p>
          </div>

          {['farmer', 'paravet', 'vet', 'admin'].includes(user?.role || '') && (
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm">
                  <PlusCircle className="h-4 w-4" />
                  {t('register_animal')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register New Livestock</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRegister} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tagUid">12-Digit Tag UID (Pashu Aadhaar) *</Label>
                    <Input
                      id="tagUid"
                      placeholder="e.g. 100029384756"
                      value={tagUid}
                      onChange={(e) => setTagUid(e.target.value)}
                      maxLength={12}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="spec">Species *</Label>
                      <select
                        id="spec"
                        value={species}
                        onChange={(e) => setSpecies(e.target.value)}
                        className="w-full h-10 px-3 py-2 text-sm rounded-md border bg-background"
                      >
                        <option value="Cattle">Cattle (Cow)</option>
                        <option value="Buffalo">Buffalo</option>
                        <option value="Goat">Goat</option>
                        <option value="Sheep">Sheep</option>
                        <option value="Swine">Swine</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="brd">Breed *</Label>
                      <Input
                        id="brd"
                        placeholder="e.g. Gir / Murrah"
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="sx">Sex *</Label>
                      <select
                        id="sx"
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full h-10 px-3 py-2 text-sm rounded-md border bg-background"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="db">Date of Birth</Label>
                      <Input id="db" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="vlg">Village *</Label>
                      <Input
                        id="vlg"
                        placeholder="e.g. Baramati"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dst">District *</Label>
                      <select
                        id="dst"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-10 px-3 py-2 text-sm rounded-md border bg-background"
                      >
                        {MAHARASHTRA_DISTRICTS.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {submitting ? 'Creating Passport...' : 'Save & Generate QR Passport'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Tag UID, breed, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-md border bg-background text-foreground"
            >
              <option value="">All Species</option>
              <option value="Cattle">Cattle</option>
              <option value="Buffalo">Buffalo</option>
              <option value="Goat">Goat</option>
              <option value="Sheep">Sheep</option>
            </select>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-md border bg-background text-foreground"
            >
              <option value="">All Districts</option>
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={fetchAnimals} className="h-10">
              Filter
            </Button>
          </div>
        </div>

        {/* Animal Cards Grid */}
        {loading ? (
          <div className="text-center p-12 space-y-2">
            <Activity className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading registry...</p>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <Card className="p-12 text-center bg-muted/20 border-dashed">
            <p className="text-sm text-muted-foreground">No animals match your search or filter criteria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAnimals.map((animal) => (
              <Card key={animal.id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
                        TAG #{animal.tag_uid}
                      </span>
                      <CardTitle className="text-base font-bold mt-0.5">
                        {animal.species} — {animal.breed}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={
                        animal.health_status === 'healthy'
                          ? 'default'
                          : animal.health_status === 'critical'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="capitalize text-xs font-semibold"
                    >
                      {animal.health_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Owner / Contact:</span>
                    <span className="font-semibold text-foreground">
                      {animal.owner?.full_name || 'Registered Owner'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Location:</span>
                    <span className="font-semibold text-foreground">
                      {animal.village}, {animal.district}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between">
                    <Link href={`/animals/${animal.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-emerald-300">
                        <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                        Health Passport
                      </Button>
                    </Link>
                    <Link href={`/report-symptom?animal_id=${animal.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50">
                        Report Issue
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

