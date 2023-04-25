let main_str = (room_names, date_1, date_2, inner = '') => {
    let str = ` `

    let player_names_query = ``;
    room_names.forEach((room, i) => {
        player_names_query += `player.player_name = '${room.name.split(":")[1]}'`
        if (i + 1 < room_names.length) player_names_query += " or ";
    })

    str += `(${player_names_query})`
    str += ` AND tourney_hand_player_statistics.date_played BETWEEN '${date_1}' AND '${date_2}'`

    return str;
}

let get_room_names = (room_names) => {
    let player_names_query = ``;
    room_names.forEach((room, i) => {
        player_names_query += `PL.player_name = '${room.name.split(":")[1]}'`
        if (i + 1 < room_names.length) player_names_query += " or ";
    })
    return player_names_query
}

let case_str = (room_names, date_1, date_2, inner = '') => {
    let str = `FROM tourney_hand_player_statistics as THPS, player as PL, tourney_blinds as TB, tourney_hand_summary as THS, lookup_actions as LA
         WHERE
         THPS.id_player = PL.id_player AND
         TB.id_blinds = THPS.id_blinds AND
         THS.id_hand = THPS.id_hand AND
         LA.id_action = THPS.id_action_p AND
         THPS.date_played BETWEEN '${date_1}' AND '${date_2}' AND `

    str += `(${get_room_names(room_names)})`
    str += `) foo`
    return str;
}

class Stats {
    constructor(room_names, date_1, date_2, db = null, res) {
        this.room_names = JSON.parse(JSON.stringify(room_names))
        this.res = res
        this.date_1 = date_1
        this.date_2 = date_2
        this.data = {}
        this.formulas = {}
        this.check_str = main_str(this.room_names, date_1, date_2)
        this.check2_str = case_str(this.room_names, date_1, date_2)
        this.room_names_for_query = get_room_names(this.room_names)
        this.line_chart_data = []
        this.left_table_data = []
        this.DB = db
    }

    async total_hands() {
        if (this.res) this.res.write("total_hands")

        let a = await this.DB.query(`
            SELECT COUNT(id_hand)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = a.rows[0].count;
        this.data['total_hands'] = isNaN(result) ? 0 : result;
        this.formulas['total_hands'] = `${a.rows[0].count}`;
    }

    async total_tournaments() {
        if (this.res) this.res.write("total_tournaments")

        let a = await this.DB.query(`
            SELECT COUNT(DISTINCT (id_tourney))
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = a.rows[0].count;
        this.data['total_tournaments'] = isNaN(result) ? 0 : result;
        this.formulas['total_tournaments'] = `${a.rows[0].count}`;
    }

    async total_chips_ev() {
        if (this.res) this.res.write("total_chips_ev")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = a.rows[0].count;
        this.data['total_chips_ev'] = isNaN(result) ? 0 : result;
        this.formulas['total_chips_ev'] = `${a.rows[0].count}`;
    }

    async total_chips_ev_from_tourney() {
        if (this.res) this.res.write("total_chips_ev_from_tourney")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won) /
                   COUNT(DISTINCT (tourney_hand_player_statistics.id_tourney))
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = a.rows[0].count;
        this.data['total_chips_ev_from_tourney'] = isNaN(result) ? 0 : result;
        this.formulas['total_chips_ev_from_tourney'] = `${a.rows[0].count}`;
    }

    async total_chips_ev_from_one_hundred_hands() {
        if (this.res) this.res.write("total_chips_ev_from_one_hundred_hands")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won) /
                   (COUNT(tourney_hand_player_statistics.id_hand) / 100)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = a.rows[0].count;
        this.data['total_chips_ev_from_one_hundred_hands'] = isNaN(result) ? 0 : result;
        this.formulas['total_chips_ev_from_one_hundred_hands'] = `${a.rows[0].count}`;
    }

    async opp_vpip_hands() {
        if (this.res) this.res.write("opp_vpip_hands")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let result = a.rows[0].count;
        this.data['opp_vpip_hands'] = isNaN(result) ? 0 : result;
        this.formulas['opp_vpip_hands'] = `${a.rows[0].count}`;
    }

    async opp_vpip_in_percentage() {
        if (this.res) this.res.write("opp_vpip_in_percentage")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['opp_vpip_in_percentage'] = isNaN(result) ? 0 : result;
        this.formulas['opp_vpip_in_percentage'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async opp_vpip_tournaments() {
        if (this.res) this.res.write("opp_vpip_tournaments")

        let a = await this.DB.query(`
            SELECT COUNT(DISTINCT (id_tourney))
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let result = a.rows[0].count;
        this.data['opp_vpip_tournaments'] = isNaN(result) ? 0 : result;
        this.formulas['opp_vpip_tournaments'] = `${a.rows[0].count}`;
    }

    async opp_chips_ev() {
        if (this.res) this.res.write("opp_chips_ev")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let result = a.rows[0].count;
        this.data['opp_chips_ev'] = isNaN(result) ? 0 : result;
        this.formulas['opp_chips_ev'] = `${a.rows[0].count}`;
    }

    async opp_chips_ev_in_percentage_of_total() {
        if (this.res) this.res.write("opp_chips_ev_in_percentage_of_total")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['opp_chips_ev_in_percentage_of_total'] = isNaN(result) ? 0 : result;
        this.formulas['opp_chips_ev_in_percentage_of_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async opp_total_chips_ev_from_tourney() {
        if (this.res) this.res.write("opp_total_chips_ev_from_tourney")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won) /
                   COUNT(DISTINCT (tourney_hand_player_statistics.id_tourney))
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let result = a.rows[0].count;
        this.data['opp_total_chips_ev_from_tourney'] = isNaN(result) ? 0 : result;
        this.formulas['opp_total_chips_ev_from_tourney'] = `${a.rows[0].count}`;
    }

    async opp_total_chips_ev_from_one_hundred_hands() {
        if (this.res) this.res.write("opp_total_chips_ev_from_one_hundred_hands")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won) /
                   (COUNT(tourney_hand_player_statistics.id_hand) / 100)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let result = a.rows[0].count;
        this.data['opp_total_chips_ev_from_one_hundred_hands'] = isNaN(result) ? 0 : result;
        this.formulas['opp_total_chips_ev_from_one_hundred_hands'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_total() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_total'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_35_plus_bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_20_35bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_16_20bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_13_16bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_10_13bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_8_10bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_Hands_0_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Hands_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let result = a.rows[0].count;
        this.data['HU_SB_Preflop_Hands_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Hands_0_8bb'] = `${a.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_total() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_total'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_35_plus_bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_20_35bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_16_20bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_13_16bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_10_13bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_8_10bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_VPIP_0_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_VPIP_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let result = ((a.rows[0].count + b.rows[0].count) / c.rows[0].count) * 100;
        this.data['HU_SB_Preflop_VPIP_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_VPIP_0_8bb'] = `(${a.rows[0].count} + ${b.rows[0].count}) / ${c.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_total() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_PFR_0_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_PFR_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_PFR_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_PFR_0_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_total() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.25
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 0 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_MR_0_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_MR_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise > 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 0 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_MR_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_MR_0_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_OS_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_OS_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_OS_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_OS_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_OS_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_OS_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_OS_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_OS_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_OS_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_OS_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_OS_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_OS_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_OS_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_OS_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_OS_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_OS_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_OS_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_OS_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_OS_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_OS_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_OS_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_OS_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_OS_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_OS_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_total() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (NOT (tourney_hand_player_statistics.flg_p_face_raise)
                OR (tourney_hand_player_statistics.flg_p_limp)
                OR (tourney_hand_player_statistics.flg_p_first_raise))
              AND NOT (tourney_hand_player_statistics.flg_blind_b)
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_0_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.id_hand > 0
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 1 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_0_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_total() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.id_hand > 0
              AND LA_P.action = 'CF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_NAI_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_NAI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_NAI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_NAI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_NAI_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_NAI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 20 and 35
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 20 and 35
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_NAI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_NAI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_NAI_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_NAI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 16 and 20
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 16 and 20
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_NAI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_NAI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_NAI_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_NAI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 13 and 16
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 13 and 16
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_NAI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_NAI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_NAI_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_NAI_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 10 AND 13
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 10 AND 13
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_NAI_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_NAI_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_NAI_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_NAI_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 8 AND 10
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 8 AND 10
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_NAI_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_NAI_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_0_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 2 and 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 2 and 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_0_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_vs_AI_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_vs_AI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_vs_AI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_vs_AI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_vs_AI_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_vs_AI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_vs_AI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_vs_AI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_vs_AI_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_vs_AI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_vs_AI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_vs_AI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_vs_AI_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_vs_AI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_vs_AI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_vs_AI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_vs_AI_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_vs_AI_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_vs_AI_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_vs_AI_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Fold_vs_AI_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Fold_vs_AI_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action = 'CF'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Fold_vs_AI_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Fold_vs_AI_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_total() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 and 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 and 35
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 and 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 and 20
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 and 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 and 16
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 and 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 and 13
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 and 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 and 10
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Limp_Raise_4_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Limp_Raise_4_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND LA_P.action LIKE 'CR%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 and 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action LIKE 'C%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 and 8
              AND (tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb) <= 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Limp_Raise_4_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Limp_Raise_4_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_NAI_total() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_NAI_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_NAI_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_NAI_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_NAI_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_NAI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_NAI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_NAI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_NAI_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_NAI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_NAI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_NAI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_NAI_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_NAI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_NAI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_NAI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_NAI_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_NAI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_NAI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_NAI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_10_13bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_8_10bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_4_8bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_4_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_4_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_4_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_AI_Total() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_AI_Total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_AI_Total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_AI_Total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_AI_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_AI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_AI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_AI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_AI_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_AI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_AI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_AI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_AI_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_AI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_AI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_AI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_Fold_vs_3bet_AI_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_Fold_vs_3bet_AI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_Fold_vs_3bet_AI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_Fold_vs_3bet_AI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_4bet_total() {
        if (this.res) this.res.write("HU_SB_Preflop_4bet_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_4bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_4bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_4bet_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_4bet_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_4bet_35_plus_bb() {
        if (this.res) this.res.write("HU_SB_Preflop_4bet_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'R'
              AND tourney_hand_player_statistics.flg_p_4bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_4bet_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_4bet_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_4bet_20_35bb() {
        if (this.res) this.res.write("HU_SB_Preflop_4bet_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'R'
              AND tourney_hand_player_statistics.flg_p_4bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_4bet_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_4bet_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_4bet_16_20bb() {
        if (this.res) this.res.write("HU_SB_Preflop_4bet_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'R'
              AND tourney_hand_player_statistics.flg_p_4bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_4bet_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_4bet_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Preflop_4bet_13_16bb() {
        if (this.res) this.res.write("HU_SB_Preflop_4bet_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'R'
              AND tourney_hand_player_statistics.flg_p_4bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Preflop_4bet_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Preflop_4bet_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_total() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_total'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_35_plus_bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_20_35bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_16_20bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.20
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_13_16bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.20
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_10_13bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_8_10bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_4_8bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_4_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_4_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_4_8bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_total() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C' OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_VPIP_4_8bb() {
        if (this.res) this.res.write("HU_BB_Preflop_VPIP_4_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR tourney_hand_player_statistics.flg_p_3bet)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.15
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.15
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_VPIP_4_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_VPIP_4_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_total() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.25
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Flat_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Flat_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Flat_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Flat_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1 OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1 OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1 OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 4
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1 OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb >= 3
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 3
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1 OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb >= 3
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 3
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1 OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb > 2
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_COS_0_8bb() {
        if (this.res) this.res.write("HU_BB_Preflop_COS_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.cnt_p_call = 1
                OR tourney_hand_player_statistics.cnt_p_raise > 0)
              AND amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.5
              AND (tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb) BETWEEN 0 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.5
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 0 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_COS_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_COS_0_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_total() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_NAI_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_NAI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 8
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_NAI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_NAI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_NAI_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_NAI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 8
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_NAI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_NAI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_NAI_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_NAI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 8
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_NAI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_NAI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_NAI_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_NAI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_NAI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_NAI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_NAI_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_NAI_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_NAI_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_NAI_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_4_8bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_4_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_4_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_4_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_AI_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_AI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 8
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_AI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_AI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_AI_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_AI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 8
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_AI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_AI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_AI_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_AI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 8
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_AI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_AI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_AI_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_AI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_AI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_AI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_3bet_AI_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_3bet_AI_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 6
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_3bet_AI_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_3bet_AI_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Fold_vs_4bet_total() {
        if (this.res) this.res.write("HU_BB_Preflop_Fold_vs_4bet_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_p_4bet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_p_4bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Fold_vs_4bet_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Fold_vs_4bet_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Fold_vs_4bet_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Fold_vs_4bet_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_p_4bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_p_4bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Fold_vs_4bet_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Fold_vs_4bet_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Fold_vs_4bet_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Fold_vs_4bet_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_p_4bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_p_4bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Fold_vs_4bet_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Fold_vs_4bet_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Fold_vs_4bet_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Fold_vs_4bet_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_p_4bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_p_4bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Fold_vs_4bet_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Fold_vs_4bet_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Fold_vs_4bet_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Fold_vs_4bet_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_p_4bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_p_4bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Fold_vs_4bet_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Fold_vs_4bet_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Fold_vs_4bet_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Fold_vs_4bet_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_p_4bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_p_4bet_def_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_Fold_vs_4bet_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Fold_vs_4bet_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_total() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_total'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_35_plus_bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_20_35bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_16_20bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_13_16bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_10_13bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_8_10bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_Hands_vs_Limp_4_8bb() {
        if (this.res) this.res.write("HU_BB_Preflop_Hands_vs_Limp_4_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 4 AND 8
        `);

        let result = a.rows[0].count;
        this.data['HU_BB_Preflop_Hands_vs_Limp_4_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_Hands_vs_Limp_4_8bb'] = `${a.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_total() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_NAI_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_NAI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_NAI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_NAI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_NAI_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_NAI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_NAI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_NAI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_NAI_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_NAI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_NAI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_NAI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_NAI_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_NAI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_NAI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_NAI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_NAI_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_NAI_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_NAI_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_NAI_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_NAI_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_NAI_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_NAI_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_NAI_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_0_8bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_0_8bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 8
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 0 AND 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_0_8bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_0_8bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_AI_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_AI_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_AI_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_AI_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_AI_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_AI_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_AI_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_AI_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_AI_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_AI_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_AI_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_AI_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_AI_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_AI_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_AI_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_AI_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_AI_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_AI_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_AI_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_AI_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_AI_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_AI_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_face_limpers > 0
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_AI_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_AI_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_total() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_total'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_35_plus_bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_35_plus_bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 35
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_35_plus_bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_35_plus_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_20_35bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_20_35bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 20 AND 35
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_20_35bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_20_35bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_16_20bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_16_20bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 16 AND 20
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_16_20bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_16_20bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_13_16bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_13_16bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 13 AND 16
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_13_16bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_13_16bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_10_13bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_10_13bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 10 AND 13
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_10_13bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_10_13bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Preflop_ISO_Fold_8_10bb() {
        if (this.res) this.res.write("HU_BB_Preflop_ISO_Fold_8_10bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_blind_b
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb BETWEEN 8 AND 10
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Preflop_ISO_Fold_8_10bb'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Preflop_ISO_Fold_8_10bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_LCB_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_LCB_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_open_opp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_LCB_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_LCB_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_LCB_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_LCB_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_t_open_opp
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_LCB_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_LCB_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_LCB_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_LCB_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_r_bet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_r_open_opp
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_LCB_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_LCB_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_FLCBvR_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_FLCBvR_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_f_face_raise
              AND LA_F.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.amt_f_raise_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_FLCBvR_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_FLCBvR_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_FLCBvR_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_FLCBvR_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_t_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_t_face_raise
              AND LA_F.action = 'B'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_FLCBvR_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_FLCBvR_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_FLCBvR_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_FLCBvR_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_r_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_bet
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND tourney_hand_player_statistics.flg_r_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_FLCBvR_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_FLCBvR_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_CLCBvR_and_Fold_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_CLCBvR_and_Fold_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'BC'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'BC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_CLCBvR_and_Fold_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_CLCBvR_and_Fold_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_CLCBvR_and_Fold_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_CLCBvR_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'B'
              AND LA_T.action = 'BC'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'B'
              AND LA_T.action = 'BC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_CLCBvR_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_CLCBvR_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Delay_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_bet
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_open_opp
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Delay_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Delay_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_r_bet
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_open_opp
              AND tourney_hand_player_statistics.flg_r_open_opp
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Delay_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Delay_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Fold_vs_Donk_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Fold_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Fold_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Fold_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Fold_vs_Donk_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Fold_vs_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Fold_vs_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Fold_vs_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Fold_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Fold_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'C'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Fold_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Fold_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Turn_and_Fold_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Call_vs_Donk_Flop_and_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Raise_vs_Donk_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Raise_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Raise_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Raise_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Raise_vs_Donk_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Raise_vs_Donk_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Raise_vs_Donk_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Raise_vs_Donk_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Raise_vs_Donk_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Raise_vs_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Raise_vs_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Raise_vs_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Fold_vs_Probe_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Fold_vs_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Fold_vs_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Fold_vs_Probe_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_LP_Call_vs_Probe_Turn_and_Folv_River() {
        if (this.res) this.res.write("HU_SB_Postflop_LP_Call_vs_Probe_Turn_and_Folv_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_LP_Call_vs_Probe_Turn_and_Folv_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_LP_Call_vs_Probe_Turn_and_Folv_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_ISO_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_ISO_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_ISO_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_ISO_Fold_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_ISO_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_ISO_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_ISO_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_ISO_Fold_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_ISO_Fold_vs_Cbet_River() {
        if (this.res) this.res.write("HU_SB_Postflop_ISO_Fold_vs_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_ISO_Fold_vs_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_ISO_Fold_vs_Cbet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_ISO_Raise_vs_Cbet_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_ISO_Raise_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_ISO_Raise_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_ISO_Raise_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_ISO_Raise_vs_Cbet_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_ISO_Raise_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_ISO_Raise_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_ISO_Raise_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_ISO_Raise_vs_Cbet_River() {
        if (this.res) this.res.write("HU_SB_Postflop_ISO_Raise_vs_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.enum_r_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'CC'
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.flg_r_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_ISO_Raise_vs_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_ISO_Raise_vs_Cbet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Cbet_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Cbet_Flop'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_SB_Postflop_RP_Cbet_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_opp
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Cbet_Turn'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_SB_Postflop_RP_Cbet_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet_opp
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Cbet_River'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_SB_Postflop_RP_FCBvR_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_FCBvR_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND LA_F.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_f_cbet
              AND LA_F.action = 'BF'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.flg_f_face_raise
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.flg_f_face_raise
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_FCBvR_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_FCBvR_Flop'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_SB_Postflop_RP_FCBvR_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_FCBvR_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND LA_T.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND LA_T.action = 'BF'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND tourney_hand_player_statistics.flg_t_face_raise
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND tourney_hand_player_statistics.flg_t_face_raise
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_FCBvR_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_FCBvR_Turn'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_SB_Postflop_RP_FCBvR_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_FCBvR_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_cbet
              AND LA_R.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_cbet
              AND LA_R.action = 'BF'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_face_raise
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_face_raise
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_FCBvR_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_FCBvR_River'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_SB_Postflop_RP_Cbet_Call_Flop_and_Fold_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Cbet_Call_Flop_and_Fold_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND LA_F.action = 'BC'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND LA_F.action = 'BC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Cbet_Call_Flop_and_Fold_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Cbet_Call_Flop_and_Fold_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Cbet_Flop_and_Cbet_Call_Turn_and_Fold_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Cbet_Flop_and_Cbet_Call_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND LA_F.action = 'B'
              AND LA_T.action = 'BC'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND LA_F.action = 'B'
              AND LA_T.action = 'BC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Cbet_Flop_and_Cbet_Call_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Cbet_Flop_and_Cbet_Call_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_3bet_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_3bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_3bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_3bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_3bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_3bet_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_3bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action SIMILAR TO '(B|C|R)'
              AND tourney_hand_player_statistics.flg_t_3bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action SIMILAR TO '(B|C|R)'
              AND tourney_hand_player_statistics.flg_t_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_3bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_3bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Delay_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_open_opp
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND LA_F.action = 'X'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Delay_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_t_cbet_opp
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_t_cbet_opp
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Delay_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Delay_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Delay_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Delay_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Fold_vs_Donk_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Fold_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Fold_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Fold_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Fold_vs_Donk_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Fold_vs_Donk_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Fold_vs_Donk_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Fold_vs_Donk_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Fold_vs_Donk_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Fold_vs_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Fold_vs_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Fold_vs_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Call_vs_Donk_Flop_and_Fold_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Call_vs_Donk_Flop_and_Fold_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action LIKE 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_f_open_opp
              AND SUBSTRING(LA_F.action from 1 for 1) = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND NOT (tourney_hand_player_statistics.flg_t_open_opp)
              AND SUBSTRING(LA_T.action from 1 for 1) = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action LIKE 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_f_open_opp
              AND LA_F.action LIKE 'C'
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Call_vs_Donk_Flop_and_Fold_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Call_vs_Donk_Flop_and_Fold_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Call_vs_Donk_Turn_and_Fold_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Call_vs_Donk_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action LIKE 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_f_open_opp
              AND SUBSTRING(LA_F.action from 1 for 1) = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
              AND SUBSTRING(LA_T.action from 1 for 1) = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_r_open_opp
              AND SUBSTRING(LA_R.action from 1 for 1) = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action LIKE 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_f_open_opp
              AND LA_F.action LIKE 'C'
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND LA_T.action LIKE 'C'
              AND NOT tourney_hand_player_statistics.flg_r_open_opp
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Call_vs_Donk_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Call_vs_Donk_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Raise_vs_Donk_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Raise_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Raise_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Raise_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Raise_vs_Donk_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Raise_vs_Donk_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Raise_vs_Donk_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Raise_vs_Donk_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Raise_vs_Donk_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Raise_vs_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Raise_vs_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Raise_vs_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND NOT tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND NOT tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Fold_vs_Probe_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Fold_vs_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_opp
              AND NOT tourney_hand_player_statistics.flg_t_cbet
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_r_open_opp
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_opp
              AND NOT tourney_hand_player_statistics.flg_t_cbet
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Fold_vs_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Fold_vs_Probe_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_RP_Call_vs_Probe_Turn_and_Fold_River() {
        if (this.res) this.res.write("HU_SB_Postflop_RP_Call_vs_Probe_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND NOT tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND NOT tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND NOT tourney_hand_player_statistics.flg_t_open_opp
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_RP_Call_vs_Probe_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_RP_Call_vs_Probe_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_3Bet_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_3Bet_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_3Bet_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_3Bet_Fold_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_3Bet_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_3Bet_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_3Bet_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_3Bet_Fold_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_3Bet_Fold_vs_Cbet_River() {
        if (this.res) this.res.write("HU_SB_Postflop_3Bet_Fold_vs_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_r_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_r_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_3Bet_Fold_vs_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_3Bet_Fold_vs_Cbet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_3Bet_Raise_vs_Cbet_Flop() {
        if (this.res) this.res.write("HU_SB_Postflop_3Bet_Raise_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_3Bet_Raise_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_3Bet_Raise_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_SB_Postflop_3Bet_Raise_vs_Cbet_Turn() {
        if (this.res) this.res.write("HU_SB_Postflop_3Bet_Raise_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_SB_Postflop_3Bet_Raise_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_SB_Postflop_3Bet_Raise_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_FvLCB_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_FvLCB_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_FvLCB_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_FvLCB_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_FvLCB_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_FvLCB_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT (tourney_hand_player_statistics.flg_p_face_raise)
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_FvLCB_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_FvLCB_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_FvLCB_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_FvLCB_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND LA_R.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT (tourney_hand_player_statistics.flg_p_face_raise)
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_FvLCB_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_FvLCB_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Raise_vs_LCB_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Raise_vs_LCB_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Raise_vs_LCB_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Raise_vs_LCB_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Raise_vs_LCB_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Raise_vs_LCB_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_check_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Raise_vs_LCB_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Raise_vs_LCB_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Raise_vs_LCB_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Raise_vs_LCB_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.flg_r_check_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Raise_vs_LCB_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Raise_vs_LCB_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check_raise
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check_raise
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check_raise
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check_raise
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Raise_vs_LCB_Flop_and_Bet_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Fold_vs_Delay_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND LA_R.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Flop_and_Bet_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Fold_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Fold_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action LIKE 'B%'
              AND tourney_hand_player_statistics.flg_f_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Fold_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Fold_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Fold_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Fold_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action LIKE 'B%'
              AND tourney_hand_player_statistics.flg_t_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Fold_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Fold_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Donk_Fold_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Donk_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND LA_R.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND LA_R.action LIKE 'B%'
              AND tourney_hand_player_statistics.flg_r_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Donk_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Donk_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Probe_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Probe_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Probe_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_LP_Probe_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_LP_Probe_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.cnt_p_raise = 0
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_LP_Probe_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_LP_Probe_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_ISO_Cbet_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_ISO_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_f_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_f_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_ISO_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_ISO_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_ISO_Cbet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_ISO_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_ISO_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_ISO_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_ISO_Cbet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_ISO_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_ISO_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_ISO_Cbet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'F'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_Cbet_Flop'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'F'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_Cbet_Turn'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Fold_vs_Cbet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_r_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_r_cbet_action = 'F'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet_def_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_r_cbet_def_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_Cbet_River'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Raise_vs_Cbet_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Raise_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'R'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Raise_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Raise_vs_Cbet_Flop'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Raise_vs_Cbet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Raise_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_t_cbet_action = 'R'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Raise_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Raise_vs_Cbet_Turn'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Raise_vs_Cbet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Raise_vs_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.enum_r_cbet_action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.enum_r_cbet_action = 'R'
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet_def_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_r_cbet_def_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Raise_vs_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Raise_vs_Cbet_River'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND LA_F.action = 'XR'
              AND NOT (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND LA_F.action = 'XR'
              AND NOT (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND LA_F.action = 'XR'
              AND NOT (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND LA_F.action = 'XR'
              AND NOT (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Raise_vs_Cbet_Flop_and_Bet_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Fold_vs_3bet_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_3bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.enum_f_3bet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_3bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_3bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_3bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Fold_vs_3bet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_3bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.enum_t_3bet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_3bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_3bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_3bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Fold_vs_Delay_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Call_vs_Delay_Turn_and_Fold_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Call_vs_Delay_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND LA_R.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Call_vs_Delay_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Call_vs_Delay_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_donk_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.flg_r_donk_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Flop_and_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
                    SSELECT COUNT(*) FROM tourney_hand_player_statistics
                    INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                    INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                    INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                    WHERE
                    ${this.check_str}
                    AND tourney_hand_player_statistics.position = 8
                    AND tourney_hand_player_statistics.cnt_players = 2
                    AND LA_P.action = 'C'
                    AND LA_F.action = 'B'
                    AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Flop_and_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Flop_and_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Flop_and_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Flop_and_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Fold_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Fold_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_f_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Fold_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Fold_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Fold_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Fold_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_t_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Fold_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Fold_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Donk_Fold_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Donk_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND LA_R.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.flg_r_bet
              AND tourney_hand_player_statistics.flg_r_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Donk_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Donk_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_RP_Probe_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Probe_Turn'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Probe_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'C'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'C'
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'C'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                OR tourney_hand_player_statistics.flg_p_4bet_def_opp)
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'C'
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Probe_River'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async HU_BB_Postflop_RP_Probe_Turn_and_Bet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_RP_Probe_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND NOT tourney_hand_player_statistics.flg_t_face_raise
              AND tourney_hand_player_statistics.flg_r_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_RP_Probe_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_RP_Probe_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_3bet_Cbet_Flop() {
        if (this.res) this.res.write("HU_BB_Postflop_3bet_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.flg_p_3bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_cbet_opp
              AND tourney_hand_player_statistics.flg_p_3bet
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_3bet_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_3bet_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_3bet_Cbet_Turn() {
        if (this.res) this.res.write("HU_BB_Postflop_3bet_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet
              AND tourney_hand_player_statistics.flg_p_3bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_t_cbet_opp
              AND tourney_hand_player_statistics.flg_p_3bet
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_3bet_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_3bet_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async HU_BB_Postflop_3bet_Cbet_River() {
        if (this.res) this.res.write("HU_BB_Postflop_3bet_Cbet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_r_cbet_opp
              AND (tourney_hand_player_statistics.flg_p_3bet
                OR tourney_hand_player_statistics.flg_p_4bet)
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['HU_BB_Postflop_3bet_Cbet_River'] = isNaN(result) ? 0 : result;
        this.formulas['HU_BB_Postflop_3bet_Cbet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_VPIP() {
        if (this.res) this.res.write("BTN_3Max_Preflop_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_Limp() {
        if (this.res) this.res.write("BTN_3Max_Preflop_Limp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.cnt_p_raise = 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_Limp'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_Limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_RFI_total() {
        if (this.res) this.res.write("BTN_3Max_Preflop_RFI_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_hand_player_statistics.amt_before < 0.25
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_RFI_total'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_RFI_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_RFI_NAI_less_2dot3x() {
        if (this.res) this.res.write("BTN_3Max_Preflop_RFI_NAI_less_2dot3x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_hand_player_statistics.amt_before < 0.25
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 2.2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_RFI_NAI_less_2dot3x'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_RFI_NAI_less_2dot3x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_RFI_NAI_more_2dot3x() {
        if (this.res) this.res.write("BTN_3Max_Preflop_RFI_NAI_more_2dot3x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_hand_player_statistics.amt_before < 0.25
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 2.21
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_RFI_NAI_more_2dot3x'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_RFI_NAI_more_2dot3x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_OS() {
        if (this.res) this.res.write("BTN_3Max_Preflop_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 2.1
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_OS'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_Fold_vs_3bet_total() {
        if (this.res) this.res.write("BTN_3Max_Preflop_Fold_vs_3bet_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_Fold_vs_3bet_total'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_Fold_vs_3bet_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Preflop_Fold_vs_3bet_more_2dot5x() {
        if (this.res) this.res.write("BTN_3Max_Preflop_Fold_vs_3bet_more_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.5
              AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Preflop_Fold_vs_3bet_more_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Preflop_Fold_vs_3bet_more_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Postflop_Cbet_Flop() {
        if (this.res) this.res.write("BTN_3Max_Postflop_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Postflop_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Postflop_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Postflop_Cbet_Turn() {
        if (this.res) this.res.write("BTN_3Max_Postflop_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_t_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_t_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Postflop_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Postflop_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Postflop_Delay_Turn() {
        if (this.res) this.res.write("BTN_3Max_Postflop_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Postflop_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Postflop_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Postflop_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("BTN_3Max_Postflop_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Postflop_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Postflop_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Postflop_Fold_vs_Donk_Flop() {
        if (this.res) this.res.write("BTN_3Max_Postflop_Fold_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_donk_def_opp
              AND tourney_hand_player_statistics.enum_f_donk_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_donk_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Postflop_Fold_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Postflop_Fold_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BTN_3Max_Postflop_Fold_vs_CheckRaise() {
        if (this.res) this.res.write("BTN_3Max_Postflop_Fold_vs_CheckRaise")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.flg_f_face_raise
              AND LA_F.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_f_cbet
              AND tourney_hand_player_statistics.flg_f_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BTN_3Max_Postflop_Fold_vs_CheckRaise'] = isNaN(result) ? 0 : result;
        this.formulas['BTN_3Max_Postflop_Fold_vs_CheckRaise'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_VPIP_vs_Limp() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_VPIP_vs_Limp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_VPIP_vs_Limp'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_VPIP_vs_Limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_OverLimp() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_OverLimp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_limp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_OverLimp'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_OverLimp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_ISO_NAI_total() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_ISO_NAI_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_ISO_NAI_total'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_ISO_NAI_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_hand_player_statistics.amt_before < 0.25
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_ISO_AI() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.enum_allin = 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_CC_vs_MR_total() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_CC_vs_MR_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_CC_vs_MR_total'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_CC_vs_MR_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_CC_vs_MR_less_2dot3x() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_CC_vs_MR_less_2dot3x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.3
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.3
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_CC_vs_MR_less_2dot3x'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_CC_vs_MR_less_2dot3x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_3bet_OS() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_3bet_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_summary.str_aggressors_p LIKE '80%'
              AND tourney_hand_summary.str_actors_p LIKE '0%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_summary.str_aggressors_p LIKE '80%'
              AND tourney_hand_summary.str_actors_p LIKE '0%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_3bet_OS'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_3bet_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_summary.str_aggressors_p LIKE '80%'
              AND tourney_hand_summary.str_actors_p LIKE '0%'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_summary.str_aggressors_p LIKE '80%'
              AND tourney_hand_summary.str_actors_p LIKE '0%'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_summary.str_aggressors_p LIKE '80%'
              AND tourney_hand_summary.str_actors_p LIKE '0%'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 2.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_summary.str_aggressors_p LIKE '80%'
              AND tourney_hand_summary.str_actors_p LIKE '0%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND tourney_hand_player_statistics.enum_f_cbet_action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Postflop_Fold_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Postflop_CheckRaise_Flop() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Postflop_CheckRaise_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_check_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Postflop_CheckRaise_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Postflop_CheckRaise_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Postflop_Probe_Turn() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Postflop_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Postflop_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Postflop_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Postflop_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Postflop_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Postflop_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Postflop_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BTN_3Max_Postflop_Donk_Flop() {
        if (this.res) this.res.write("SB_vs_BTN_3Max_Postflop_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_donk
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND LA_P.action = 'C'
              AND tourney_hand_player_statistics.flg_f_donk_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BTN_3Max_Postflop_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BTN_3Max_Postflop_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_VPIP() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_hand_player_statistics.amt_before < 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_hand_player_statistics.amt_before >= 0.4
        `);

        let c = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
        `);

        let d = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count - b.rows[0].count) / (c.rows[0].count - d.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_VPIP'] = `(${a.rows[0].count} - ${b.rows[0].count}) / (${c.rows[0].count} - ${d.rows[0].count})`;
    }

    async SB_vs_BB_3Max_Preflop_OpenLimp() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_OpenLimp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_OpenLimp'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_OpenLimp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_OpenLimp_Fold() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_OpenLimp_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_folded = 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_player_statistics.flg_p_face_raise
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_OpenLimp_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_OpenLimp_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_RFI_less_2dot3x() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_RFI_less_2dot3x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.3
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_RFI_less_2dot3x'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_RFI_less_2dot3x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_RFI_between_2dot2_and_2dot6() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_RFI_between_2dot2_and_2dot6")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 2.2
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_RFI_between_2dot2_and_2dot6'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_RFI_between_2dot2_and_2dot6'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_RFI_between_2dot5_and_3dot1() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_RFI_between_2dot5_and_3dot1")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 2.5
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 3.1
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_RFI_between_2dot5_and_3dot1'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_RFI_between_2dot5_and_3dot1'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_Fold_vs_3bet_more_2dot5x() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_Fold_vs_3bet_more_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2.5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_Fold_vs_3bet_more_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_Fold_vs_3bet_more_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Preflop_OS() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Preflop_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.enum_allin = 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Preflop_OS'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Preflop_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_RP_Cbet_Flop() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_RP_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_RP_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_RP_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_RP_Cbet_Turn() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_RP_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_RP_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_RP_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_RP_CheckRaise_Flop() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_RP_CheckRaise_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND LA_F.action = 'XR'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND LA_F.action LIKE 'X%'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_RP_CheckRaise_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_RP_CheckRaise_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_RP_Delay_Turn() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_RP_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_check
              AND NOT tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_RP_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_RP_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_RP_CheckFold_Flop() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_RP_CheckFold_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_f_fold
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_RP_CheckFold_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_RP_CheckFold_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_RP_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_RP_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.flg_t_fold
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_player_statistics.flg_f_cbet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_RP_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_RP_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_LP_Cbet_Flop() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_LP_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_LP_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_LP_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_LP_Cbet_Turn() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_LP_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_LP_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_LP_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_LP_CheckRaise_Flop() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_LP_CheckRaise_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action = 'XR'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND LA_F.action LIKE 'X%'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_LP_CheckRaise_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_LP_CheckRaise_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_LP_Delay_Turn() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_LP_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check
              AND NOT tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_LP_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_LP_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_LP_CheckFold_Flop() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_LP_CheckFold_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_f_fold
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_LP_CheckFold_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_LP_CheckFold_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async SB_vs_BB_3Max_Postflop_LP_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("SB_vs_BB_3Max_Postflop_LP_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.flg_t_fold
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.flg_p_limp
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_f_bet
              AND NOT tourney_hand_player_statistics.flg_f_face_raise
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['SB_vs_BB_3Max_Postflop_LP_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['SB_vs_BB_3Max_Postflop_LP_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_ISO_NAI_vs_Limp() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_ISO_NAI_vs_Limp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 1 for 1) = '0'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 1 for 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_ISO_NAI_vs_Limp'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_ISO_NAI_vs_Limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 1 for 1) = '0'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 1 for 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_ISO_NAI_less_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_ISO_AI() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.enum_allin = 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 1 for 1) = '0'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 1 for 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_Call_vs_MR_less_2dot3x() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_Call_vs_MR_less_2dot3x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2.2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_Call_vs_MR_less_2dot3x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_Call_vs_MR_less_2dot3x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin = 'P'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 3) = '080'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 4
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 2 for 1) = '8'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_3bet_NAI_less_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin = 'P'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 3) = '080'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 4
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND SUBSTRING(tourney_hand_summary.str_actors_p from 2 for 1) = '8'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_3bet_NAI_more_2dot4x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Preflop_3bet_AI() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Preflop_3bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin = 'P'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 2) = '08'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 3
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Preflop_3bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Preflop_3bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Postflop_RP_CheckRaise_Flop() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Postflop_RP_CheckRaise_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'XR'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Postflop_RP_CheckRaise_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Postflop_RP_CheckRaise_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Postflop_RP_Probe_Turn() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Postflop_RP_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_made > 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_made > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Postflop_RP_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Postflop_RP_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'X'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Postflop_RP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_BTN_3Max_Postflop_RP_Donk_Flop() {
        if (this.res) this.res.write("BB_vs_BTN_3Max_Postflop_RP_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.flg_f_donk
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_face_allin = 'P'
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 2
              AND tourney_hand_player_statistics.flg_f_donk_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_BTN_3Max_Postflop_RP_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_BTN_3Max_Postflop_RP_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_ISO_NAI_total() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_ISO_NAI_total")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_summary.str_actors_p LIKE '98%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_ISO_NAI_total'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_ISO_NAI_total'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_ISO_NAI_less_2dot5x() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_ISO_NAI_less_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_summary.str_actors_p LIKE '98%'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_ISO_NAI_less_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_ISO_NAI_less_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_ISO_AI() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.enum_allin = 'P'
              AND tourney_hand_summary.str_actors_p LIKE '98%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_Call_vs_MR_less_2dot3x() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_Call_vs_MR_less_2dot3x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_Call_vs_MR_less_2dot3x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_Call_vs_MR_less_2dot3x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot2x_and_2dot6x() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot2x_and_2dot6x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.21
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.21
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot2x_and_2dot6x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot2x_and_2dot6x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot5x_and_3dot1x() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot5x_and_3dot1x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.5
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2.1
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.5
              AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2.1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot5x_and_3dot1x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_Call_vs_RFI_between_2dot5x_and_3dot1x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_3bet_NAI_less_2dot5x() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_3bet_NAI_less_2dot5x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_summary.str_actors_p LIKE '989%'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '98%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_3bet_NAI_less_2dot5x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_3bet_NAI_less_2dot5x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_3bet_NAI_more_2dot4x() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_3bet_NAI_more_2dot4x")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_summary.str_actors_p LIKE '989%'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb >= 5
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P'
                OR tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '98%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_3bet_NAI_more_2dot4x'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_3bet_NAI_more_2dot4x'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Preflop_3bet_AI() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Preflop_3bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_player_statistics.flg_p_3bet
              AND (tourney_hand_player_statistics.enum_allin = 'P' OR tourney_hand_player_statistics.enum_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '989%'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND tourney_hand_summary.str_actors_p LIKE '98%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Preflop_3bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Preflop_3bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND LA_F.action = 'C'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.flg_t_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_RP_Fold_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_RP_Raise_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_RP_Raise_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.flg_f_first_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P' OR
                       tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.flg_f_cbet_def_opp
              AND NOT (tourney_hand_player_statistics.enum_face_allin_action = 'F' OR
                       tourney_hand_player_statistics.enum_face_allin_action = 'f')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_RP_Raise_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_RP_Raise_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_RP_Float_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_RP_Float_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P'
                OR tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.amt_f_bet_made / tourney_blinds.amt_bb > 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P'
                OR tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND NOT tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_RP_Float_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_RP_Float_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_RP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_RP_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P'
                OR tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_fold
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT (tourney_hand_player_statistics.enum_face_allin = 'P'
                OR tourney_hand_player_statistics.enum_face_allin = 'p')
              AND LA_P.action = 'C'
              AND tourney_hand_summary.str_actors_p = '98'
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.amt_t_bet_facing / tourney_blinds.amt_bb > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_RP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_RP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND tourney_hand_player_statistics.amt_f_bet_facing / tourney_blinds.amt_bb > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Turn() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND LA_F.action = 'C'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing / tourney_blinds.amt_bb > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_LP_Fold_vs_Cbet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_LP_Raise_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_LP_Raise_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND tourney_hand_player_statistics.flg_f_first_raise
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND tourney_hand_player_statistics.amt_f_bet_facing / tourney_blinds.amt_bb > 0
              AND NOT (tourney_hand_player_statistics.enum_face_allin_action = 'F'
                OR tourney_hand_player_statistics.enum_face_allin_action = 'f')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_LP_Raise_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_LP_Raise_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_LP_Float_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_LP_Float_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND tourney_hand_player_statistics.amt_f_bet_made / tourney_blinds.amt_bb > 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND tourney_hand_player_statistics.flg_f_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_LP_Float_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_LP_Float_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_LP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_LP_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND LA_F.action = 'X'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p = '9'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing / tourney_blinds.amt_bb > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_LP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_LP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async BB_vs_SB_3Max_Postflop_ISO_Cbet_Flop() {
        if (this.res) this.res.write("BB_vs_SB_3Max_Postflop_ISO_Cbet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p LIKE '98%'
              AND tourney_hand_player_statistics.flg_f_cbet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_summary.str_actors_p LIKE '98%'
              AND tourney_hand_player_statistics.flg_f_cbet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['BB_vs_SB_3Max_Postflop_ISO_Cbet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['BB_vs_SB_3Max_Postflop_ISO_Cbet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

}

module.exports = Stats
