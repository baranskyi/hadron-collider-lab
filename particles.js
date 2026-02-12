// ============================================
// Particle Physics Data & Definitions
// ============================================

export const PARTICLE_TYPES = {
    // Bosons
    photon:   { symbol: 'γ',  name: 'Photon',     mass: 0,        charge: 0,   spin: 1,   lifetime: 'stable',  type: 'boson',   color: 0xffd700, trail: 'straight' },
    gluon:    { symbol: 'g',  name: 'Gluon',      mass: 0,        charge: 0,   spin: 1,   lifetime: 'stable',  type: 'boson',   color: 0xff8800, trail: 'spiral' },
    W_plus:   { symbol: 'W⁺', name: 'W⁺ Boson',   mass: 80.4,     charge: 1,   spin: 1,   lifetime: '3×10⁻²⁵s', type: 'boson', color: 0xff00ff, trail: 'short' },
    W_minus:  { symbol: 'W⁻', name: 'W⁻ Boson',   mass: 80.4,     charge: -1,  spin: 1,   lifetime: '3×10⁻²⁵s', type: 'boson', color: 0xff00ff, trail: 'short' },
    Z:        { symbol: 'Z⁰', name: 'Z Boson',    mass: 91.2,     charge: 0,   spin: 1,   lifetime: '3×10⁻²⁵s', type: 'boson', color: 0xff00ff, trail: 'short' },
    higgs:    { symbol: 'H',  name: 'Higgs Boson', mass: 125.1,    charge: 0,   spin: 0,   lifetime: '1.6×10⁻²²s', type: 'boson', color: 0xfffacd, trail: 'flash' },

    // Leptons
    electron: { symbol: 'e⁻', name: 'Electron',   mass: 0.000511, charge: -1,  spin: 0.5, lifetime: 'stable',  type: 'lepton', color: 0x00bfff, trail: 'helix_tight' },
    positron: { symbol: 'e⁺', name: 'Positron',    mass: 0.000511, charge: 1,   spin: 0.5, lifetime: 'stable',  type: 'lepton', color: 0x00bfff, trail: 'helix_tight' },
    muon_m:   { symbol: 'μ⁻', name: 'Muon',        mass: 0.1057,   charge: -1,  spin: 0.5, lifetime: '2.2×10⁻⁶s', type: 'lepton', color: 0x00ff88, trail: 'helix_wide' },
    muon_p:   { symbol: 'μ⁺', name: 'Antimuon',    mass: 0.1057,   charge: 1,   spin: 0.5, lifetime: '2.2×10⁻⁶s', type: 'lepton', color: 0x00ff88, trail: 'helix_wide' },
    tau_m:    { symbol: 'τ⁻', name: 'Tau',          mass: 1.777,    charge: -1,  spin: 0.5, lifetime: '2.9×10⁻¹³s', type: 'lepton', color: 0x00ccaa, trail: 'short' },
    tau_p:    { symbol: 'τ⁺', name: 'Antitau',      mass: 1.777,    charge: 1,   spin: 0.5, lifetime: '2.9×10⁻¹³s', type: 'lepton', color: 0x00ccaa, trail: 'short' },
    nu_e:     { symbol: 'νₑ', name: 'Electron Neutrino', mass: 0, charge: 0, spin: 0.5, lifetime: 'stable', type: 'lepton', color: 0xaa66ff, trail: 'dashed' },
    nu_mu:    { symbol: 'νμ', name: 'Muon Neutrino',     mass: 0, charge: 0, spin: 0.5, lifetime: 'stable', type: 'lepton', color: 0xaa66ff, trail: 'dashed' },
    nu_tau:   { symbol: 'ντ', name: 'Tau Neutrino',       mass: 0, charge: 0, spin: 0.5, lifetime: 'stable', type: 'lepton', color: 0xaa66ff, trail: 'dashed' },

    // Quarks (observed as jets)
    b_jet:    { symbol: 'b',  name: 'b-quark jet', mass: 4.18,     charge: -1/3, spin: 0.5, lifetime: '~10⁻¹²s', type: 'quark', color: 0xff4444, trail: 'jet' },
    t_quark:  { symbol: 't',  name: 'Top Quark',   mass: 173.0,    charge: 2/3,  spin: 0.5, lifetime: '5×10⁻²⁵s', type: 'quark', color: 0xff6666, trail: 'short' },
    jet:      { symbol: 'jet', name: 'Hadron Jet', mass: 0,        charge: 0,    spin: 0,   lifetime: 'n/a',      type: 'quark', color: 0xff4444, trail: 'jet' },

    // Composite
    proton:   { symbol: 'p',  name: 'Proton',      mass: 0.9383,   charge: 1,   spin: 0.5, lifetime: 'stable',  type: 'baryon', color: 0xffffff, trail: 'beam' },
    pion_p:   { symbol: 'π⁺', name: 'Pion+',      mass: 0.1396,   charge: 1,   spin: 0,   lifetime: '2.6×10⁻⁸s', type: 'meson', color: 0xffaa44, trail: 'helix_tight' },
    pion_m:   { symbol: 'π⁻', name: 'Pion-',      mass: 0.1396,   charge: -1,  spin: 0,   lifetime: '2.6×10⁻⁸s', type: 'meson', color: 0xffaa44, trail: 'helix_tight' },
    kaon:     { symbol: 'K',  name: 'Kaon',        mass: 0.4937,   charge: 1,   spin: 0,   lifetime: '1.2×10⁻⁸s', type: 'meson', color: 0xddaa00, trail: 'helix_wide' },
};

// Decay channel: each entry is { products: [...keys], probability, description }
export const EXPERIMENT_PRESETS = [
    {
        id: 'higgs_diphoton',
        name: 'Higgs → γγ',
        description: 'Higgs boson decays into two high-energy photons. The "golden channel" for Higgs discovery.',
        energy: '13.6 TeV',
        rarity: 'Rare',
        decayChain: [
            { parent: 'higgs', products: ['photon', 'photon'], delay: 0 },
        ],
        secondaryParticles: ['jet', 'jet', 'muon_m', 'nu_mu'],
    },
    {
        id: 'higgs_4lepton',
        name: 'Higgs → ZZ → 4ℓ',
        description: 'Higgs decays to two Z bosons, each Z decays into a lepton pair. Cleanest Higgs signature.',
        energy: '13.6 TeV',
        rarity: 'Very Rare',
        decayChain: [
            { parent: 'higgs', products: ['Z', 'Z'], delay: 0 },
            { parent: 'Z', products: ['electron', 'positron'], delay: 200, index: 0 },
            { parent: 'Z', products: ['muon_m', 'muon_p'], delay: 200, index: 1 },
        ],
        secondaryParticles: ['jet', 'jet'],
    },
    {
        id: 'top_pair',
        name: 'Top Quark Pair (tt̄)',
        description: 'Proton collision produces a top-antitop pair. Each decays to W boson + b-quark jet.',
        energy: '13.6 TeV',
        rarity: 'Common',
        decayChain: [
            { parent: null, products: ['t_quark', 't_quark'], delay: 0 },
            { parent: 't_quark', products: ['W_plus', 'b_jet'], delay: 150, index: 0 },
            { parent: 't_quark', products: ['W_minus', 'b_jet'], delay: 150, index: 1 },
            { parent: 'W_plus', products: ['muon_p', 'nu_mu'], delay: 300, index: 0 },
            { parent: 'W_minus', products: ['electron', 'nu_e'], delay: 300, index: 1 },
        ],
        secondaryParticles: ['jet', 'pion_p', 'pion_m'],
    },
    {
        id: 'qgp',
        name: 'Quark-Gluon Plasma',
        description: 'Heavy ion collision creates a hot, dense state of matter — quark-gluon plasma. Hundreds of particles produced.',
        energy: '5.36 TeV/nucleon',
        rarity: 'Heavy Ion',
        decayChain: [
            { parent: null, products: ['gluon', 'gluon', 'gluon', 'gluon'], delay: 0 },
        ],
        secondaryParticles: [
            'pion_p', 'pion_m', 'pion_p', 'pion_m', 'pion_p', 'pion_m',
            'kaon', 'kaon', 'proton', 'proton',
            'muon_m', 'muon_p', 'electron', 'positron',
            'jet', 'jet', 'jet', 'jet',
            'photon', 'photon', 'photon',
        ],
    },
    {
        id: 'wz_decay',
        name: 'W/Z Boson Production',
        description: 'Direct W or Z boson production via Drell-Yan process. Clean leptonic decay.',
        energy: '13.6 TeV',
        rarity: 'Common',
        decayChain: [
            { parent: null, products: ['Z'], delay: 0 },
            { parent: 'Z', products: ['muon_m', 'muon_p'], delay: 150, index: 0 },
        ],
        secondaryParticles: ['jet', 'jet', 'photon'],
    },
    {
        id: 'b_meson',
        name: 'B-Meson / CP Violation',
        description: 'B-meson produced in collision oscillates between matter and antimatter states before decaying.',
        energy: '13.6 TeV',
        rarity: 'Specialized',
        decayChain: [
            { parent: null, products: ['b_jet', 'b_jet'], delay: 0 },
            { parent: 'b_jet', products: ['kaon', 'pion_m'], delay: 400, index: 0 },
            { parent: 'b_jet', products: ['muon_m', 'nu_mu'], delay: 500, index: 1 },
        ],
        secondaryParticles: ['jet', 'pion_p', 'photon'],
    },
    {
        id: 'higgs_ww',
        name: 'Higgs → WW → ℓνℓν',
        description: 'Higgs decays to two W bosons. Each W produces a lepton + neutrino. Beautiful butterfly pattern with missing energy.',
        energy: '13.6 TeV',
        rarity: 'Rare',
        decayChain: [
            { parent: 'higgs', products: ['W_plus', 'W_minus'], delay: 0 },
            { parent: 'W_plus', products: ['positron', 'nu_e'], delay: 180, index: 0 },
            { parent: 'W_minus', products: ['muon_m', 'nu_mu'], delay: 180, index: 1 },
        ],
        secondaryParticles: ['jet', 'jet', 'photon', 'pion_p', 'pion_m'],
    },
    {
        id: 'z_to_tautau',
        name: 'Z → τ⁺τ⁻ → Multi-decay',
        description: 'Z boson decays into tau pair. Each tau decays further into lighter particles — a cascade of 3 generations.',
        energy: '13.6 TeV',
        rarity: 'Uncommon',
        decayChain: [
            { parent: null, products: ['Z'], delay: 0 },
            { parent: 'Z', products: ['tau_m', 'tau_p'], delay: 150, index: 0 },
            { parent: 'tau_m', products: ['electron', 'nu_e', 'nu_tau'], delay: 350, index: 0 },
            { parent: 'tau_p', products: ['pion_p', 'pion_p', 'pion_m', 'nu_tau'], delay: 350, index: 1 },
        ],
        secondaryParticles: ['jet', 'photon', 'photon'],
    },
    {
        id: 'diphoton_shower',
        name: 'e⁺e⁻ Annihilation Shower',
        description: 'Electron-positron pair annihilate into photons, which convert back into particle pairs — a cascade of matter creation from pure energy.',
        energy: '13.6 TeV',
        rarity: 'Spectacular',
        decayChain: [
            { parent: null, products: ['electron', 'positron'], delay: 0 },
            { parent: null, products: ['photon', 'photon'], delay: 200 },
            { parent: null, products: ['muon_m', 'muon_p'], delay: 350 },
            { parent: null, products: ['photon', 'photon', 'photon'], delay: 500 },
            { parent: null, products: ['electron', 'positron', 'electron', 'positron'], delay: 650 },
        ],
        secondaryParticles: [
            'pion_p', 'pion_m', 'pion_p', 'pion_m',
            'kaon', 'photon', 'photon',
            'nu_e', 'nu_mu',
        ],
    },
];
