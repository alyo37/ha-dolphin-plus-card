# Dolphin Plus Card

Carte Lovelace dédiée pour les robots **MyDolphin Plus** (intégration WiFi).

Style moderne inspiré des mockups, avec sélection du mode de nettoyage.

## Installation via HACS

1. HACS → Frontend → Custom repositories
2. Ajoute : `https://github.com/TON_USERNAME/ha-dolphin-plus-card`
3. Catégorie : Lovelace
4. Installe la carte

## Configuration

```yaml
type: custom:dolphin-plus-card
name: Mon Dolphin
entity: vacuum.ton_robot
```

L’entité `vacuum` de l’intégration MyDolphin Plus suffit (elle contient les modes via fan_speed).
