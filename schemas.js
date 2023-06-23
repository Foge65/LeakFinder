const preflop_schema = {
    'Total': [
        {
            func: "total_hands",
            name: 'Total Hands',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "total_tournaments",
            name: 'Total Tournaments',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "total_chips_ev",
            name: 'Total Chips',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "total_chips_ev_from_tourney",
            name: 'Total ChipsEV/Tournaments',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'Total Preflop Test': [
        {
            func: "total_chips_ev_from_one_hundred_hands",
            name: 'total_chips_ev_from_one_hundred_hands',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_vpip_hands",
            name: 'opp_vpip_hands',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_vpip_in_percentage",
            name: 'opp_vpip_in_percentage',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_vpip_tournaments",
            name: 'opp_vpip_tournaments',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_chips_ev",
            name: 'opp_chips_ev',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_chips_ev_in_percentage_of_total",
            name: 'opp_chips_ev_in_percentage_of_total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_total_chips_ev_from_tourney",
            name: 'opp_total_chips_ev_from_tourney',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "opp_total_chips_ev_from_one_hundred_hands",
            name: 'opp_total_chips_ev_from_one_hundred_hands',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Hands': [
        {
            func: "HU_SB_Preflop_Hands_total",
            name: 'Total Hands',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_35_plus_bb",
            name: 'Hands 35++bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_20_35bb",
            name: 'Hands 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_16_20bb",
            name: 'Hands 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_13_16bb",
            name: 'Hands 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_10_13bb",
            name: 'Hands 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_8_10bb",
            name: 'Hands 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Hands_0_8bb",
            name: 'Hands 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
    ],
    'HU SB VPIP': [
        {
            func: "HU_SB_Preflop_VPIP_total",
            name: 'VPIP Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_35_plus_bb",
            name: 'VPIP 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_20_35bb",
            name: 'VPIP 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_16_20bb",
            name: 'VPIP 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_13_16bb",
            name: 'VPIP 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_10_13bb",
            name: 'VPIP 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_8_10bb",
            name: 'VPIP 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_VPIP_0_8bb",
            name: 'VPIP 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB PFR': [
        {
            func: "HU_SB_Preflop_PFR_total",
            name: 'PFR Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_35_plus_bb",
            name: 'PFR 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_20_35bb",
            name: 'PFR 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_16_20bb",
            name: 'PFR 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_13_16bb",
            name: 'PFR 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_10_13bb",
            name: 'PFR 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_8_10bb",
            name: 'PFR 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_PFR_0_8bb",
            name: 'PFR 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
    ],
    'HU SB MR': [
        {
            func: "HU_SB_Preflop_MR_total",
            name: 'MR Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_35_plus_bb",
            name: 'MR 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_20_35bb",
            name: 'MR 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_16_20bb",
            name: 'MR 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_13_16bb",
            name: 'MR 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_10_13bb",
            name: 'MR 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_8_10bb",
            name: 'MR 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_MR_0_8bb",
            name: 'MR 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
    ],
    'HU SB OS': [
        {
            func: "HU_SB_Preflop_OS_35_plus_bb",
            name: 'OS 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_OS_20_35bb",
            name: 'OS 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_OS_16_20bb",
            name: 'OS 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_OS_13_16bb",
            name: 'OS 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_OS_10_13bb",
            name: 'OS 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_OS_8_10bb",
            name: 'OS 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Limp': [
        {
            func: "HU_SB_Preflop_Limp_total",
            name: 'Limp Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_35_plus_bb",
            name: 'Limp 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_20_35bb",
            name: 'Limp 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_16_20bb",
            name: 'Limp 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_13_16bb",
            name: 'Limp 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_10_13bb",
            name: 'Limp 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_8_10bb",
            name: 'Limp 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_0_8bb",
            name: 'Limp 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Limp-Fold': [
        {
            func: "HU_SB_Preflop_Limp_Fold_total",
            name: 'Limp-Fold Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_0_8bb",
            name: 'Limp-Fold 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Limp-Fold vs NAI': [
        {
            func: "HU_SB_Preflop_Limp_Fold_NAI_35_plus_bb",
            name: 'Limp-Fold vs NAI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_NAI_20_35bb",
            name: 'Limp-Fold vs NAI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_NAI_16_20bb",
            name: 'Limp-Fold vs NAI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_NAI_13_16bb",
            name: 'Limp-Fold vs NAI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_NAI_10_13bb",
            name: 'Limp-Fold vs NAI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_NAI_8_10bb",
            name: 'Limp-Fold vs NAI 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Limp-Fold vs AI': [
        {
            func: "HU_SB_Preflop_Limp_Fold_vs_AI_35_plus_bb",
            name: 'Limp-Fold vs AI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_vs_AI_20_35bb",
            name: 'Limp-Fold vs AI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_vs_AI_16_20bb",
            name: 'Limp-Fold vs AI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_vs_AI_13_16bb",
            name: 'Limp-Fold vs AI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_vs_AI_10_13bb",
            name: 'Limp-Fold vs AI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Fold_vs_AI_8_10bb",
            name: 'Limp-Fold vs AI 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Limp-Raise': [
        {
            func: "HU_SB_Preflop_Limp_Raise_total",
            name: 'Limp-Raise Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_35_plus_bb",
            name: 'Limp-Raise 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_20_35bb",
            name: 'Limp-Raise 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_16_20bb",
            name: 'Limp-Raise 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_13_16bb",
            name: 'Limp-Raise 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_10_13bb",
            name: 'Limp-Raise 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_8_10bb",
            name: 'Limp-Raise 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Limp_Raise_4_8bb",
            name: 'Limp-Raise 4-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Fold vs 3bet NAI': [
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_NAI_total",
            name: 'Fold vs 3bet NAI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_NAI_35_plus_bb",
            name: 'Fold vs 3bet NAI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_NAI_20_35bb",
            name: 'Fold vs 3bet NAI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_NAI_16_20bb",
            name: 'Fold vs 3bet NAI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_NAI_13_16bb",
            name: 'Fold vs 3bet NAI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_10_13bb",
            name: 'Fold vs 3bet NAI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_8_10bb",
            name: 'Fold vs 3bet NAI 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_4_8bb",
            name: 'Fold vs 3bet NAI 4-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB Fold vs 3bet AI': [
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_AI_Total",
            name: 'Fold vs 3bet AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_AI_35_plus_bb",
            name: 'Fold vs 3bet AI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_AI_20_35bb",
            name: 'Fold vs 3bet AI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_AI_16_20bb",
            name: 'Fold vs 3bet AI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_Fold_vs_3bet_AI_13_16bb",
            name: 'Fold vs 3bet AI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB 4bet': [
        {
            func: "HU_SB_Preflop_4bet_total",
            name: '4bet Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_4bet_35_plus_bb",
            name: '4bet 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_4bet_20_35bb",
            name: '4bet 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_4bet_16_20bb",
            name: '4bet 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Preflop_4bet_13_16bb",
            name: '4bet 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB Hands': [
        {
            func: "HU_BB_Preflop_Hands_total",
            name: 'Hands Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_35_plus_bb",
            name: 'Hands 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_20_35bb",
            name: 'Hands 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_16_20bb",
            name: 'Hands 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_13_16bb",
            name: 'Hands 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_10_13bb",
            name: 'Hands 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_8_10bb",
            name: 'Hands 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_4_8bb",
            name: 'Hands 4-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB VPIP': [
        {
            func: "HU_BB_Preflop_VPIP_total",
            name: 'VPIP Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_35_plus_bb",
            name: 'VPIP 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_20_35bb",
            name: 'VPIP 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_16_20bb",
            name: 'VPIP 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_13_16bb",
            name: 'VPIP 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_10_13bb",
            name: 'VPIP 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_8_10bb",
            name: 'VPIP 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_VPIP_4_8bb",
            name: 'VPIP 4-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB Flat': [
        {
            func: "HU_BB_Preflop_Flat_total",
            name: 'Flat Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Flat_35_plus_bb",
            name: 'Flat 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Flat_20_35bb",
            name: 'Flat 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Flat_16_20bb",
            name: 'Flat 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Flat_13_16bb",
            name: 'Flat 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Flat_10_13bb",
            name: 'Flat 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Flat_8_10bb",
            name: 'Flat 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB COS': [
        {
            func: "HU_BB_Preflop_COS_35_plus_bb",
            name: 'COS 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_COS_20_35bb",
            name: 'COS 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_COS_16_20bb",
            name: 'COS 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_COS_13_16bb",
            name: 'COS 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_COS_10_13bb",
            name: 'COS 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_COS_8_10bb",
            name: 'COS 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_COS_0_8bb",
            name: 'COS 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB 3bet': [
        {
            func: "HU_BB_Preflop_3bet_total",
            name: '3bet Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_8_10bb",
            name: '3bet 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_4_8bb",
            name: '3bet 4-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB 3bet NAI': [
        {
            func: "HU_BB_Preflop_3bet_NAI_35_plus_bb",
            name: '3bet NAI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_NAI_20_35bb",
            name: '3bet NAI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_NAI_16_20bb",
            name: '3bet NAI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_NAI_13_16bb",
            name: '3bet NAI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_NAI_10_13bb",
            name: '3bet NAI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB 3bet AI': [
        {
            func: "HU_BB_Preflop_3bet_AI_35_plus_bb",
            name: '3bet AI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_AI_20_35bb",
            name: '3bet AI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_AI_16_20bb",
            name: '3bet AI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_AI_13_16bb",
            name: '3bet AI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_3bet_AI_10_13bb",
            name: '3bet AI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB Fold vs 4bet': [
        {
            func: "HU_BB_Preflop_Fold_vs_4bet_total",
            name: 'Fold vs 4bet Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Fold_vs_4bet_35_plus_bb",
            name: 'Fold vs 4bet 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Fold_vs_4bet_20_35bb",
            name: 'Fold vs 4bet 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Fold_vs_4bet_16_20bb",
            name: 'Fold vs 4bet 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Fold_vs_4bet_13_16bb",
            name: 'Fold vs 4bet 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Fold_vs_4bet_10_13bb",
            name: 'Fold vs 4bet 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB Hands vs Limp': [
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_total",
            name: 'Hands vs Limp Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_35_plus_bb",
            name: 'Hands vs Limp 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_20_35bb",
            name: 'Hands vs Limp 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_16_20bb",
            name: 'Hands vs Limp 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_13_16bb",
            name: 'Hands vs Limp 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_10_13bb",
            name: 'Hands vs Limp 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_8_10bb",
            name: 'Hands vs Limp 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_Hands_vs_Limp_4_8bb",
            name: 'Hands vs Limp 4-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB ISO': [
        {
            func: "HU_BB_Preflop_ISO_total",
            name: 'ISO Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_0_8bb",
            name: 'ISO 0-8bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB ISO NAI': [
        {
            func: "HU_BB_Preflop_ISO_NAI_35_plus_bb",
            name: 'ISO NAI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }, {
            func: "HU_BB_Preflop_ISO_NAI_20_35bb",
            name: 'ISO NAI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }, {
            func: "HU_BB_Preflop_ISO_NAI_16_20bb",
            name: 'ISO NAI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }, {
            func: "HU_BB_Preflop_ISO_NAI_13_16bb",
            name: 'ISO NAI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }, {
            func: "HU_BB_Preflop_ISO_NAI_10_13bb",
            name: 'ISO NAI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }, {
            func: "HU_BB_Preflop_ISO_NAI_8_10bb",
            name: 'ISO NAI 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
    ],
    'HU BB ISO AI': [
        {
            func: "HU_BB_Preflop_ISO_AI_35_plus_bb",
            name: 'ISO AI 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_AI_20_35bb",
            name: 'ISO AI 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_AI_16_20bb",
            name: 'ISO AI 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_AI_13_16bb",
            name: 'ISO AI 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_AI_10_13bb",
            name: 'ISO AI 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_AI_8_10bb",
            name: 'ISO AI 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB ISO-Fold': [
        {
            func: "HU_BB_Preflop_ISO_Fold_total",
            name: 'ISO-Fold Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_Fold_35_plus_bb",
            name: 'ISO-Fold 35+bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_Fold_20_35bb",
            name: 'ISO-Fold 20-35bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_Fold_16_20bb",
            name: 'ISO-Fold 16-20bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_Fold_13_16bb",
            name: 'ISO-Fold 13-16bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_Fold_10_13bb",
            name: 'ISO-Fold 10-13bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Preflop_ISO_Fold_8_10bb",
            name: 'ISO-Fold 8-10bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN VPIP': [
        {
            func: "BTN_3Max_Preflop_VPIP",
            name: 'VPIP Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN Limp': [
        {
            func: "BTN_3Max_Preflop_Limp",
            name: 'Limp Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN RFI': [
        {
            func: "BTN_3Max_Preflop_RFI_total",
            name: 'RFI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BTN_3Max_Preflop_RFI_NAI_less_2dot3x",
            name: 'RFI NAI < 2.3bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BTN_3Max_Preflop_RFI_NAI_more_2dot3x",
            name: 'RFI NAI > 2.2bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN OS': [
        {
            func: "BTN_3Max_Preflop_OS",
            name: 'OpenShove Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN Fold vs 3Bet': [
        {
            func: "BTN_3Max_Preflop_Fold_vs_3bet_total",
            name: 'Fold vs 3Bet Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BTN_3Max_Preflop_Fold_vs_3bet_more_2dot5x",
            name: 'Fold vs 3Bet > 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN VPIP vs Limp': [
        {
            func: "SB_vs_BTN_3Max_Preflop_VPIP_vs_Limp",
            name: 'VPIP vs Limp Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN OverLimp vs Limp': [
        {
            func: "SB_vs_BTN_3Max_Preflop_OverLimp",
            name: 'OverLimp vs Limp Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN ISO NAI': [
        {
            func: "SB_vs_BTN_3Max_Preflop_ISO_NAI_total",
            name: 'ISO NAI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x",
            name: 'ISO NAI < 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN ISO AI': [
        {
            func: "SB_vs_BTN_3Max_Preflop_ISO_AI",
            name: 'ISO AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN CC vs MR': [
        {
            func: "SB_vs_BTN_3Max_Preflop_CC_vs_MR_total",
            name: 'CC vs MR Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BTN_3Max_Preflop_CC_vs_OR_less_2dot3x",
            name: 'CC vs < 2.3bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN 3Bet AI': [
        {
            func: "SB_vs_BTN_3Max_Preflop_3bet_OS",
            name: '3Bet AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN 3Bet NAI': [
        {
            func: "SB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x",
            name: '3Bet NAI < 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x",
            name: '3Bet NAI > 2.4bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }

    ],
    '3Max SB-BB VPIP': [
        {
            func: "SB_vs_BB_3Max_Preflop_VPIP",
            name: 'VPIP Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB OpenLimp': [
        {
            func: "SB_vs_BB_3Max_Preflop_OpenLimp",
            name: 'Limp Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Preflop_OpenLimp_Fold",
            name: 'Limp-Fold Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB RFI': [
        {
            func: "SB_vs_BB_3Max_Preflop_RFI_less_2dot3x",
            name: 'RFI < 2.3bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Preflop_RFI_between_2dot2_and_2dot6",
            name: '2.2bb < RFI < 2.6bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Preflop_RFI_between_2dot5_and_3dot1",
            name: '2.5bb < RFI < 3.1bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB Fold vs 3Bet': [
        {
            func: "SB_vs_BB_3Max_Preflop_Fold_vs_3bet_more_2dot5x",
            name: 'Fold vs 3Bet > 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB OS': [
        {
            func: "SB_vs_BB_3Max_Preflop_OS",
            name: 'OpenShove Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN ISO NAI': [
        {
            func: "BB_vs_BTN_3Max_Preflop_ISO_NAI_vs_Limp",
            name: 'ISO NAI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x",
            name: 'ISO NAI < 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN ISO AI': [
        {
            func: "BB_vs_BTN_3Max_Preflop_ISO_AI",
            name: 'ISO AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN CC vs OR': [
        {
            func: "BB_vs_BTN_3Max_Preflop_Call_vs_OR_less_2dot3x",
            name: 'CC vs OR < 2.3bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN 3Bet NAI': [
        {
            func: "BB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x",
            name: '3Bet NAI < 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x",
            name: '3Bet NAI > 2.4bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN 3Bet AI': [
        {
            func: "BB_vs_BTN_3Max_Preflop_3bet_AI",
            name: '3Bet AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB ISO NAI': [
        {
            func: "BB_vs_SB_3Max_Preflop_ISO_NAI_total",
            name: 'ISO NAI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_SB_3Max_Preflop_ISO_NAI_less_2dot5x",
            name: 'ISO NAI < 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB ISO AI': [
        {
            func: "BB_vs_SB_3Max_Preflop_ISO_AI",
            name: 'ISO AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB Call vs OR': [
        {
            func: "BB_vs_SB_3Max_Preflop_Call_vs_OR_less_2dot3x",
            name: 'Call vs OR < 2.3bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot2x_and_2dot6x",
            name: '2.2bb < Call vs OR < 2.6bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot5x_and_3dot1x",
            name: '2.5bb < Call vs OR < 3.1bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB 3Bet NAI': [
        {
            func: "BB_vs_SB_3Max_Preflop_3bet_NAI_less_2dot5x",
            name: '3Bet NAI < 2.5bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_SB_3Max_Preflop_3bet_NAI_more_2dot4x",
            name: '3Bet NAI > 2.4bb',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB 3Bet AI': [
        {
            func: "BB_vs_SB_3Max_Preflop_3bet_AI",
            name: '3Bet AI Total',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
}

const postflop_schema = {
    'HU SB LP LCBet': [
        {
            func: "HU_SB_Postflop_LP_LCB_Flop",
            name: 'LimpBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_LCB_Turn",
            name: 'LimpBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_LCB_River",
            name: 'LimpBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Fold vs Check-Raise': [
        {
            func: "HU_SB_Postflop_LP_FLCBvR_Flop",
            name: 'Fold vs Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_FLCBvR_Turn",
            name: 'Fold vs Check-Raise Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_FLCBvR_River",
            name: 'Fold vs Check-Raise River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Call vs Check-Raise': [
        {
            func: "HU_SB_Postflop_LP_CLCBvR_and_Fold_Turn",
            name: 'Call vs Check-Raise Flop and Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_CLCBvR_and_Fold_River",
            name: 'Call vs Check-Raise Turn and Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Delay': [
        {
            func: "HU_SB_Postflop_LP_Delay_Turn",
            name: 'Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_Delay_Turn_and_Bet_River",
            name: 'Delay River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Fold vs Donk': [
        {
            func: "HU_SB_Postflop_LP_Fold_vs_Donk_Flop",
            name: 'Fold vs Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_Fold_vs_Donk_River",
            name: 'Fold vs Donk River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Call vs Donk and Fold': [
        {
            func: "HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Fold_Turn",
            name: 'Call vs Donk Flop and Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Turn_and_Fold_River",
            name: 'Call vs Donk Flop and Turn and Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Raise vs Donk': [
        {
            func: "HU_SB_Postflop_LP_Raise_vs_Donk_Flop",
            name: 'Raise vs Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_Raise_vs_Donk_Turn",
            name: 'Raise vs Donk Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_Raise_vs_Donk_River",
            name: 'Raise vs Donk Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Fold vs Probe': [
        {
            func: "HU_SB_Postflop_LP_Fold_vs_Probe_Turn",
            name: 'Fold vs Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_LP_Fold_vs_Probe_River",
            name: 'Fold vs Probe River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB LP Call vs Probe': [
        {
            func: "HU_SB_Postflop_LP_Call_vs_Probe_Turn_and_Fold_River",
            name: 'Call vs Probe Turn and Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB ISO Fold vs CBet': [
        {
            func: "HU_SB_Postflop_ISO_Fold_vs_Cbet_Flop",
            name: 'Fold vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_ISO_Fold_vs_Cbet_Turn",
            name: 'Fold vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_ISO_Fold_vs_Cbet_River",
            name: 'Fold vs CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB ISO Raise vs CBet': [
        {
            func: "HU_SB_Postflop_ISO_Raise_vs_Cbet_Flop",
            name: 'Raise vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_ISO_Raise_vs_Cbet_Turn",
            name: 'Raise vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_ISO_Raise_vs_Cbet_River",
            name: 'Raise vs CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP CBet': [
        {
            func: "HU_SB_Postflop_RP_Cbet_Flop",
            name: 'CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Cbet_Turn",
            name: 'CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Cbet_River",
            name: 'CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Fold vs Check-Raise': [
        {
            func: "HU_SB_Postflop_RP_FCBvR_Flop",
            name: 'Fold vs Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_FCBvR_Turn",
            name: 'Fold vs Check-Raise Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_FCBvR_River",
            name: 'Fold vs Check-Raise River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Call vs Check-Raise': [
        {
            func: "HU_SB_Postflop_RP_Cbet_Call_Flop_and_Fold_Turn",
            name: 'Call vs Check-Raise Flop and Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Cbet_Flop_and_Cbet_Call_Turn_and_Fold_River",
            name: 'Call vs Check-Raise Flop and Turn and Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP 3Bet': [
        {
            func: "HU_SB_Postflop_RP_3bet_Flop",
            name: '3Bet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_3bet_Turn",
            name: '3Bet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Delay': [
        {
            func: "HU_SB_Postflop_RP_Delay_Turn",
            name: 'Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Delay_River",
            name: 'Delay River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Delay_Turn_and_Bet_River",
            name: 'Delay Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Fold vs Donk': [
        {
            func: "HU_SB_Postflop_RP_Fold_vs_Donk_Flop",
            name: 'Fold vs Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Fold_vs_Donk_Turn",
            name: 'Fold vs Donk Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Fold_vs_Donk_River",
            name: 'Fold vs Donk River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Call vs Donk': [
        {
            func: "HU_SB_Postflop_RP_Call_vs_Donk_Flop_and_Fold_Turn",
            name: 'Call vs Donk Flop and Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Call_vs_Donk_Turn_and_Fold_River",
            name: 'Call vs Donk Turn and Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Raise vs Donk': [
        {
            func: "HU_SB_Postflop_RP_Raise_vs_Donk_Flop",
            name: 'Raise vs Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Raise_vs_Donk_Turn",
            name: 'Raise vs Donk Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Raise_vs_Donk_River",
            name: 'Raise vs Donk River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Fold vs Probe': [
        {
            func: "HU_SB_Postflop_RP_Fold_vs_Probe_Turn",
            name: 'Fold vs Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Fold_vs_Probe_River",
            name: 'Fold vs Probe River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB RP Call vs Probe': [
        {
            func: "HU_SB_Postflop_RP_Call_vs_Probe_Turn_and_Fold_River",
            name: 'Call vs Probe Turn and Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_RP_Fold_vs_Probe_River",
            name: 'Fold vs Probe River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB 3Bet Fold vs CBet': [
        {
            func: "HU_SB_Postflop_3Bet_Fold_vs_Cbet_Flop",
            name: 'Fold vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_3Bet_Fold_vs_Cbet_Turn",
            name: 'Fold vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_3Bet_Fold_vs_Cbet_River",
            name: 'Fold vs CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU SB 3Bet Raise vs CBet': [
        {
            func: "HU_SB_Postflop_3Bet_Raise_vs_Cbet_Flop",
            name: 'Raise vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_SB_Postflop_3Bet_Raise_vs_Cbet_Turn",
            name: 'Raise vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB LP Fold vs LCBet': [
        {
            func: "HU_BB_Postflop_LP_FvLCB_Flop",
            name: 'Fold vs LCBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_FvLCB_Turn",
            name: 'Fold vs LCBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_FvLCB_River",
            name: 'Fold vs LCBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB LP Raise vs LCBet': [
        {
            func: "HU_BB_Postflop_LP_Raise_vs_LCB_Flop",
            name: 'Check-Raise vs LCBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Raise_vs_LCB_Turn",
            name: 'Check-Raise vs LCBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Raise_vs_LCB_River",
            name: 'Check-Raise vs LCBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn",
            name: 'Check-Raise vs LCBet Flop and Bet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn_and_Bet_River",
            name: 'Check-Raise vs LCBet Flop and Bet Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB LP Fold vs Delay': [
        {
            func: "HU_BB_Postflop_LP_Fold_vs_Delay_Turn",
            name: 'Fold vs Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Fold_vs_Delay_River",
            name: 'Fold vs Delay River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB LP Donk': [
        {
            func: "HU_BB_Postflop_LP_Donk_Flop",
            name: 'Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Donk_Turn",
            name: 'Donk Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Donk_River",
            name: 'Donk River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn",
            name: 'Donk Flop and Bet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn_and_Bet_River",
            name: 'Donk Flop and Bet Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB LP Donk-Fold': [
        {
            func: "HU_BB_Postflop_LP_Donk_Fold_Flop",
            name: 'Donk-Fold Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Donk_Fold_Turn",
            name: 'Donk-Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Donk_Fold_River",
            name: 'Donk-Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB LP Probe': [
        {
            func: "HU_BB_Postflop_LP_Probe_Turn",
            name: 'Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Probe_River",
            name: 'Probe River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_LP_Probe_Turn_and_Bet_River",
            name: 'Probe Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB ISO CBet': [
        {
            func: "HU_BB_Postflop_ISO_Cbet_Flop",
            name: 'CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_ISO_Cbet_Turn",
            name: 'CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_ISO_Cbet_River",
            name: 'CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Fold vs Cbet': [
        {
            func: "HU_BB_Postflop_RP_Fold_vs_Cbet_Flop",
            name: 'Fold vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Fold_vs_Cbet_Turn",
            name: 'Fold vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Fold_vs_Cbet_River",
            name: 'Fold vs CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Check-Raise': [
        {
            func: "HU_BB_Postflop_RP_Raise_vs_Cbet_Flop",
            name: 'Check-Raise vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Raise_vs_Cbet_Turn",
            name: 'Check-Raise vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Raise_vs_Cbet_River",
            name: 'Check-Raise vs CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn",
            name: 'Check-Raise vs CBet Flop and Bet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn_and_Bet_River",
            name: 'Check-Raise vs CBet Flop and Bet Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Fold vs 3Bet': [
        {
            func: "HU_BB_Postflop_RP_Fold_vs_3bet_Flop",
            name: 'Fold vs 3Bet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Fold_vs_3bet_Turn",
            name: 'Fold vs 3Bet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Fold vs Delay': [
        {
            func: "HU_BB_Postflop_RP_Fold_vs_Delay_Turn",
            name: 'Fold vs Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Fold_vs_Delay_River",
            name: 'Fold vs Delay River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Call vs Delay': [
        {
            func: "HU_BB_Postflop_RP_Call_vs_Delay_Turn_and_Fold_River",
            name: 'Call vs Delay Turn and Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Donk': [
        {
            func: "HU_BB_Postflop_RP_Donk_Flop",
            name: 'Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Donk_Turn",
            name: 'Donk Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Donk_River",
            name: 'Donk River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Donk_Flop_and_Bet_Turn",
            name: 'Donk Flop and Bet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Donk_Flop_and_Turn_and_Bet_River",
            name: 'Donk Flop and Bet Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Donk-Fold': [
        {
            func: "HU_BB_Postflop_RP_Donk_Fold_Flop",
            name: 'Donk-Fold Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Donk_Fold_Turn",
            name: 'Donk-Fold Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Donk_Fold_River",
            name: 'Donk-Fold River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB RP Probe': [
        {
            func: "HU_BB_Postflop_RP_Probe_Turn",
            name: 'Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Probe_River",
            name: 'Probe River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_RP_Probe_Turn_and_Bet_River",
            name: 'Probe Turn and Bet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    'HU BB 3Bet CBet': [
        {
            func: "HU_BB_Postflop_3bet_Cbet_Flop",
            name: 'CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_3bet_Cbet_Turn",
            name: 'CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "HU_BB_Postflop_3bet_Cbet_River",
            name: 'CBet River',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN CBet': [
        {
            func: "BTN_3Max_Postflop_Cbet_Flop",
            name: 'CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BTN_3Max_Postflop_Cbet_Turn",
            name: 'CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN Delay': [
        {
            func: "BTN_3Max_Postflop_Delay_Turn",
            name: 'Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN Fold vs Probe': [
        {
            func: "BTN_3Max_Postflop_Fold_vs_Probe_Turn",
            name: 'Fold vs Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN Fold vs Donk': [
        {
            func: "BTN_3Max_Postflop_Fold_vs_Donk_Flop",
            name: 'Fold vs Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BTN Fold vs Check-Raise': [
        {
            func: "BTN_3Max_Postflop_Fold_vs_CheckRaise_Flop",
            name: 'Fold vs Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN Fold vs CBet': [
        {
            func: "SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Flop",
            name: 'Fold vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Turn",
            name: 'Fold vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }

    ],
    '3Max SB-BTN Check-Raise': [
        {
            func: "SB_vs_BTN_3Max_Postflop_CheckRaise_Flop",
            name: 'Check-Raise vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN Probe': [
        {
            func: "SB_vs_BTN_3Max_Postflop_Probe_Turn",
            name: 'Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN Fold vs Delay': [
        {
            func: "SB_vs_BTN_3Max_Postflop_Fold_vs_Delay_Turn",
            name: 'Fold vs Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BTN Donk': [
        {
            func: "SB_vs_BTN_3Max_Postflop_Donk_Flop",
            name: 'Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB RP CBet': [
        {
            func: "SB_vs_BB_3Max_Postflop_RP_Cbet_Flop",
            name: 'CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Postflop_RP_Cbet_Turn",
            name: 'CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB RP Check-Raise': [
        {
            func: "SB_vs_BB_3Max_Postflop_RP_CheckRaise_Flop",
            name: 'Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB RP Delay Turn': [
        {
            func: "SB_vs_BB_3Max_Postflop_RP_Delay_Turn",
            name: 'Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB RP Check-Fold': [
        {
            func: "SB_vs_BB_3Max_Postflop_RP_CheckFold_Flop",
            name: 'Check-Fold Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB RP Fold vs Probe': [
        {
            func: "SB_vs_BB_3Max_Postflop_RP_Fold_vs_Probe_Turn",
            name: 'Fold vs Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB LP LCBet': [
        {
            func: "SB_vs_BB_3Max_Postflop_LP_Cbet_Flop",
            name: 'LCBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Postflop_LP_Cbet_Turn",
            name: 'LCBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB LP Check-Raise': [
        {
            func: "SB_vs_BB_3Max_Postflop_LP_CheckRaise_Flop",
            name: 'Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Postflop_LP_Cbet_Turn",
            name: 'LCBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB LP Delay': [
        {
            func: "SB_vs_BB_3Max_Postflop_LP_Delay_Turn",
            name: 'Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "SB_vs_BB_3Max_Postflop_LP_Cbet_Turn",
            name: 'LCBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB LP Check-Fold': [
        {
            func: "SB_vs_BB_3Max_Postflop_LP_CheckFold_Flop",
            name: 'Check-Fold Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max SB-BB LP Fold vs Probe': [
        {
            func: "SB_vs_BB_3Max_Postflop_LP_Fold_vs_Probe_Turn",
            name: 'Fold vs Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN RP Fold vs CBet': [
        {
            func: "BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Flop",
            name: 'Fold vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Turn",
            name: 'Fold vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN RP Check-Raise': [
        {
            func: "BB_vs_BTN_3Max_Postflop_RP_CheckRaise_Flop",
            name: 'Check-Raise vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN RP Probe': [
        {
            func: "BB_vs_BTN_3Max_Postflop_RP_Probe_Turn",
            name: 'Probe Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN RP Fold vs Delay': [
        {
            func: "BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Delay_Turn",
            name: 'Fold vs Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-BTN RP Donk Flop': [
        {
            func: "BB_vs_BTN_3Max_Postflop_RP_Donk_Flop",
            name: 'Donk Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB RP Fold vs CBet': [
        {
            func: "BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Flop",
            name: 'Fold vs CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Turn",
            name: 'Fold vs CBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB RP Check-Raise': [
        {
            func: "BB_vs_SB_3Max_Postflop_RP_Raise_Flop",
            name: 'Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB RP Float': [
        {
            func: "BB_vs_SB_3Max_Postflop_RP_Float_Flop",
            name: 'Float Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB RP Fold vs Delay': [
        {
            func: "BB_vs_SB_3Max_Postflop_RP_Fold_vs_Delay_Turn",
            name: 'Fold vs Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB LP Fold vs LCBet': [
        {
            func: "BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Flop",
            name: 'Fold vs LCBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        },
        {
            func: "BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Turn",
            name: 'Fold vs LCBet Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB LP Check-Raise': [
        {
            func: "BB_vs_SB_3Max_Postflop_LP_Raise_Flop",
            name: 'Check-Raise Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB LP Float': [
        {
            func: "BB_vs_SB_3Max_Postflop_LP_Float_Flop",
            name: 'Float Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB LP Fold vs Delay': [
        {
            func: "BB_vs_SB_3Max_Postflop_LP_Fold_vs_Delay_Turn",
            name: 'Fold vs Delay Turn',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
    '3Max BB-SB ISO CBet': [
        {
            func: "BB_vs_SB_3Max_Postflop_ISO_Cbet_Flop",
            name: 'CBet Flop',
            value: 0,
            title: "подсказка",
            standards: [400, 1000],
            evStandards: [1, 100],
            is_visible: true,
            formula: "None"
        }
    ],
}