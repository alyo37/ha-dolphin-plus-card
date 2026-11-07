class DolphinPlusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity (vacuum)');
    }
    this._config = {
      name: config.name || 'My Dolphin Plus',
      entity: config.entity,
      ...config
    };
  }

  getCardSize() {
    return 4;
  }

  render() {
    if (!this._hass || !this._config) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) {
      this.shadowRoot.innerHTML = `<ha-card><div style="padding:16px">Entité introuvable</div></ha-card>`;
      return;
    }

    const state = entity.state || 'unknown';
    const fanMode = entity.attributes.fan_speed || entity.attributes.cleaning_mode || '—';
    const isCleaning = ['cleaning', 'returning'].includes(state);
    const isOn = !['off', 'idle', 'docked', 'unknown'].includes(state);

    const statusLabel = this.getStatusLabel(state);
    const statusColor = this.getStatusColor(state);

    // Modes dynamiques depuis l'entité vacuum
    const availableModes = entity.attributes.fan_speed_list || entity.attributes.fan_speeds || [];
    const modes = availableModes.length > 0
      ? availableModes.map(m => ({ value: m, label: this.prettyMode(m) }))
      : [
          { value: 'all', label: 'Regular' },
          { value: 'short', label: 'Fast' },
          { value: 'floor', label: 'Floor only' },
          { value: 'water', label: 'Water line' },
          { value: 'ultra', label: 'Ultra clean' }
        ];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
        .card {
          background: linear-gradient(160deg, #0f172a 0%, #1e293b 70%, #0f172a 100%);
          border-radius: 16px;
          padding: 12px 14px;
          color: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          position: relative;
          overflow: hidden;
        }
        .card::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .title {
          font-size: 1.35rem;
          font-weight: 650;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .status-pill {
          background: ${statusColor}22;
          color: ${statusColor};
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1px solid ${statusColor}55;
        }
        .robot {
          text-align: center;
          font-size: 3.6rem;
          margin: 0 0 6px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
          transition: transform 0.4s ease;
        }
        .robot.cleaning { animation: float 2.4s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .info-box {
          background: rgba(30,41,59,0.65);
          border-radius: 12px;
          padding: 8px 12px;
          margin: 6px 0;
          border: 1px solid rgba(71,85,105,0.5);
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          margin: 4px 0;
        }
        .label { color: #94a3b8; font-weight: 500; }
        .select {
          background: #0f172a;
          color: white;
          border: 1px solid #475569;
          border-radius: 10px;
          padding: 8px 12px;
          width: 100%;
          font-size: 0.95rem;
          margin-top: 6px;
        }
        .controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }
        .btn {
          background: #334155;
          border: none;
          border-radius: 12px;
          padding: 10px;
          color: white;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn:hover { background: #475569; transform: translateY(-1px); }
        .btn.primary { background: #16a34a; }
        .btn.primary:hover { background: #15803d; }
        .btn.danger { background: #dc2626; }
        .btn.danger:hover { background: #b91c1c; }
      </style>

      <ha-card class="card">
        <div class="header">
          <h2 class="title">${this._config.name}</h2>
          <div class="status-pill">${statusLabel}</div>
        </div>

        <div class="robot ${isCleaning ? 'cleaning' : ''}">
          ${isCleaning ? '🐬' : '💤'}
        </div>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Mode actuel</span>
            <span>${fanMode}</span>
          </div>
          <div class="info-row">
            <span class="label">État</span>
            <span>${state}</span>
          </div>
        </div>

        <div class="info-box">
          <div class="label">Choisir un mode</div>
          <select class="select" id="mode-select">
            ${modes.map(m => `<option value="${m.value}" ${fanMode === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>

        <div class="controls">
          <button class="btn ${isOn ? 'danger' : 'primary'}" id="power-btn">
            ${isOn ? '⏹ Arrêter' : '▶ Démarrer'}
          </button>
          <button class="btn" id="home-btn">🏠 Rentrer</button>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('power-btn')?.addEventListener('click', () => {
      const service = isOn ? 'stop' : 'start';
      this._hass.callService('vacuum', service, { entity_id: this._config.entity });
    });

    this.shadowRoot.getElementById('home-btn')?.addEventListener('click', () => {
      this._hass.callService('vacuum', 'return_to_base', { entity_id: this._config.entity });
    });

    const modeSelect = this.shadowRoot.getElementById('mode-select');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this._hass.callService('vacuum', 'set_fan_speed', {
          entity_id: this._config.entity,
          fan_speed: e.target.value
        });
      });
    }
  }

  prettyMode(mode) {
    const map = {
      'all': 'Regular',
      'short': 'Fast',
      'floor': 'Floor only',
      'water': 'Water line',
      'ultra': 'Ultra clean',
      'pickup': 'Pickup'
    };
    return map[mode] || mode;
  }

  getStatusLabel(state) {
    const map = {
      'cleaning': 'Nettoyage',
      'returning': 'Retour',
      'docked': 'Au dock',
      'idle': 'En attente',
      'off': 'Arrêté',
      'paused': 'Pause',
      'error': 'Erreur'
    };
    return map[state] || state;
  }

  getStatusColor(state) {
    if (['cleaning', 'returning'].includes(state)) return '#22c55e';
    if (['idle', 'docked', 'paused'].includes(state)) return '#eab308';
    if (state === 'error') return '#ef4444';
    return '#94a3b8';
  }
}

customElements.define('dolphin-plus-card', DolphinPlusCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'dolphin-plus-card',
  name: 'Dolphin Plus Card',
  description: 'Carte dédiée pour MyDolphin Plus'
});
