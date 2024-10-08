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

    async Preflop_EV() {
        if (this.res) this.res.write("Preflop_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players BETWEEN 2 AND 3
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_EV() {
        if (this.res) this.res.write("Preflop_3Max_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BTN_EV() {
        if (this.res) this.res.write("Preflop_3Max_BTN_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BTN_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BTN_VPIP() {
        if (this.res) this.res.write("Preflop_3Max_BTN_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_OR_less_2_2bb() {
        if (this.res) this.res.write("Preflop_3Max_BTN_OR_less_2_2bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb > 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_OR_less_2_2bb'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_OR_less_2_2bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_Call_vs_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BTN_Call_vs_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND LA_P.action = 'RC'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
              AND char_length(tourney_hand_summary.str_actors_p) = 3
              AND LA_F.id_action != 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_4bet_opp
              AND (LA_P.action = 'RF'
                       AND char_length(tourney_hand_summary.str_actors_p) = 2
                       AND LA_F.id_action = 0
                OR LA_P.action = 'RC'
                       AND LA_F.id_action != 0
                       AND char_length(tourney_hand_summary.str_actors_p) = 3
                OR LA_P.action = 'RR'
                       AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 4) SIMILAR TO '0909|0808'
                       AND char_length(tourney_hand_summary.str_aggressors_p) = 4)
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_Call_vs_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_Call_vs_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_Call_vs_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_BTN_Call_vs_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND LA_P.action = 'RC'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
              AND char_length(tourney_hand_summary.str_actors_p) = 3
              AND LA_F.id_action = 0
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND (LA_P.action = 'RF'
                       AND char_length(tourney_hand_summary.str_actors_p) = 2
                OR LA_P.action = 'RC'
                       AND char_length(tourney_hand_summary.str_actors_p) = 3)
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_Call_vs_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_Call_vs_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_4Bet_OS() {
        if (this.res) this.res.write("Preflop_3Max_BTN_4Bet_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.flg_p_4bet
              AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 3) SIMILAR TO '090|080'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND (tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb < 2.2
                AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P')
              AND (tourney_hand_player_statistics.flg_p_3bet_def_opp
                AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_4Bet_OS'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_4Bet_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_OS() {
        if (this.res) this.res.write("Preflop_3Max_BTN_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.3
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_OS'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_OR_more_2_2bb() {
        if (this.res) this.res.write("Preflop_3Max_BTN_OR_more_2_2bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_OR_more_2_2bb'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_OR_more_2_2bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BTN_Limp() {
        if (this.res) this.res.write("Preflop_3Max_BTN_Limp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BTN_Limp'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BTN_Limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_EV() {
        if (this.res) this.res.write("Preflop_3Max_SB_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_SB_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_SB_VPIP() {
        if (this.res) this.res.write("Preflop_3Max_SB_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_EV() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_summary.str_actors_p = '09'
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_SB_vs_BTN_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_VPIP() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_vpip
              AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
              AND LA_P.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_Limp_EV() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_Limp_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_summary.str_actors_p = '09'
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_SB_vs_BTN_Limp_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_Limp_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OverLimp() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OverLimp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND (LA_P.action SIMILAR TO 'C|CC'
                       AND LA_F.id_action != 0
                OR LA_P.action = 'CF'
                OR LA_P.action LIKE 'CR%')
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OverLimp'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OverLimp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_ISO_NAI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_ISO_AI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_EV() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND (tourney_hand_player_statistics.flg_f_saw
                       AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_Call() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND LA_P.action = 'C'
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND amt_p_effective_stack / tourney_blinds.amt_bb >= 2
              AND (LA_P.action = 'F'
                OR LA_P.action = 'C'
                       AND LA_F.id_action != 0
                OR LA_P.action SIMILAR TO 'CC|CR|CF'
                OR LA_P.action LIKE 'R%')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 3 FOR 1) = '0'
                OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 3 FOR 1) = '')
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND (LA_P.action = 'F'
                       AND tourney_hand_summary.str_actors_p = '0'
                OR LA_P.action = 'C'
                       AND tourney_hand_summary.str_actors_p = '09'
                       AND LA_F.id_action != 0
                OR LA_P.action LIKE 'R%')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_less_2_2bb_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_EV() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2.2
              AND (tourney_hand_player_statistics.flg_f_saw
                       AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_Call() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND substring(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BTN_OR_more_2_2bb_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_EV() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND (SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '9'
                OR SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '')
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_SB_vs_BB_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_VPIP() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_summary.str_actors_p LIKE '9%'
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BB_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_Limp() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_Limp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND tourney_hand_summary.str_actors_p LIKE '9%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BB_Limp'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_Limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_OR_NAI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_OR_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_summary.str_actors_p LIKE '9%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND (LA_P.action = 'C'
                       AND LA_F.id_action != 0
                OR LA_P.action = 'F'
                OR LA_P.action LIKE 'R')
              AND (tourney_hand_summary.str_actors_p LIKE '9%'
                OR tourney_hand_summary.str_actors_p = '')
              AND tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb > 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BB_OR_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_OR_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'RF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
              AND LA_P.action = 'RF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_Fold_vs_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_SB_vs_BB_OS() {
        if (this.res) this.res.write("Preflop_3Max_SB_vs_BB_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND amt_before / tourney_blinds.amt_bb >= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_SB_vs_BB_OS'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_SB_vs_BB_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_VPIP() {
        if (this.res) this.res.write("Preflop_3Max_BB_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_BTN_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_Limp_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_Limp_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_BTN_Limp_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_Limp_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_Check() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_Check")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND LA_P.action = 'X'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_Check'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_Check'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_Limp_ISO_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_Limp_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND LA_P.action LIKE 'R%'
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb >= 6
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_Limp_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_Limp_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_Limp_ISO_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_Limp_ISO_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND LA_P.action = 'RF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND LA_P.action SIMILAR TO 'RC|RF'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_Limp_ISO_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_Limp_ISO_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_Limp_ISO_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_Limp_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_Limp_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_Limp_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND ((SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8')
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '')
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 1 FOR 2) = '80'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 2
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND ((SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8')
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb <= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND ((SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8')
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb <= 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_less_2_2bb_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.201
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND ((SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8')
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND NOT tourney_hand_player_statistics.flg_p_4bet_opp
              AND NOT tourney_hand_player_statistics.flg_p_squeeze_opp
              AND SUBSTRING(tourney_hand_summary.str_aggressors_p FROM 2 FOR 1) = '0'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND ((SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8')
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb >= 2.2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
                AND ((SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8')
                    OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = ''))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OR_more_2_2bb_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OS_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OS_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '')
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_BTN_OS_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OS_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_BTN_OS_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_BTN_OS_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'
              AND (SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '8'
                OR SUBSTRING(tourney_hand_summary.str_actors_p FROM 2 FOR 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_BTN_OS_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_BTN_OS_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_SB_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_Limp_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_Limp_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 2
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 2
              AND (LA_P.action = 'X'
                OR LA_P.action = 'R')
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_SB_Limp_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_Limp_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_Limp_Check_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_Limp_Check_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND LA_P.action = 'X'
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_SB_Limp_Check_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_Limp_Check_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_Limp_Check() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_Limp_Check")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_summary.str_actors_p = '9'
              AND LA_P.action = 'X'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_Limp_Check'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_Limp_Check'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_Limp_ISO_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_Limp_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_Limp_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_Limp_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_Limp_ISO_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_Limp_ISO_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND LA_P.action = 'RF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND (LA_P.action = 'RF'
                OR LA_P.action = 'RC')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_Limp_ISO_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_Limp_ISO_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_Limp_ISO_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_Limp_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND LA_P.action = 'R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_Limp_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_Limp_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OR_NAI_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OR_NAI_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 2
              AND (LA_P.action = 'F'
                OR LA_P.action = 'C'
                OR LA_P.action = 'R')
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_SB_OR_NAI_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OR_NAI_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OR_NAI_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OR_NAI_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_OR_NAI_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OR_NAI_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OR_NAI_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OR_NAI_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_OR_NAI_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OR_NAI_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.3
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.6
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.26
              AND tourney_hand_player_statistics.flg_p_3bet_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OR_NAI_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OS_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OS_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND (LA_P.action = 'F'
                OR LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 3
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_vs_SB_OS_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OS_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_vs_SB_OS_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_vs_SB_OS_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND (LA_P.action = 'F'
                OR LA_P.action = 'C'
                OR LA_P.action = 'R')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_vs_SB_OS_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_vs_SB_OS_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_3Way_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_2_Limps_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_2_Limps_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_3Way_2_Limps_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_2_Limps_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_2_Limps_Check() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_2_Limps_Check")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND LA_P.action = 'X'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND (LA_P.action = 'X'
                OR LA_P.action = 'R')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_2_Limps_Check'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_2_Limps_Check'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_2_Limps_ISO_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_2_Limps_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_2_Limps_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_2_Limps_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_2_Limps_ISO_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_2_Limps_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND (LA_P.action = 'X'
                OR LA_P.action = 'R')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_2_Limps_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_2_Limps_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 3
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 3
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_AI() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack >= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 3
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 3
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OR_NAI_and_SB_Call_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OS_and_SB_Call_EV() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OS_and_SB_Call_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
        `);

        let result = a.rows[0].count;
        this.data['Preflop_3Max_BB_3Way_OS_and_SB_Call_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OS_and_SB_Call_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OS_and_SB_Call_Fold() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OS_and_SB_Call_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 3
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 3
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_OS_and_SB_Call_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OS_and_SB_Call_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_3Max_BB_3Way_OS_and_SB_Call_Call() {
        if (this.res) this.res.write("Preflop_3Max_BB_3Way_OS_and_SB_Call_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_squeeze_opp
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 3
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 3
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_3Max_BB_3Way_OS_and_SB_Call_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_3Max_BB_3Way_OS_and_SB_Call_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_EV() {
        if (this.res) this.res.write("Preflop_HU_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_SB_EV() {
        if (this.res) this.res.write("Preflop_HU_SB_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_SB_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_SB_VPIP() {
        if (this.res) this.res.write("Preflop_HU_SB_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Limp() {
        if (this.res) this.res.write("Preflop_HU_SB_Limp")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Limp'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Limp_Fold_vs_ISO_NAI() {
        if (this.res) this.res.write("Preflop_HU_SB_Limp_Fold_vs_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'CF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action SIMILAR TO 'C(F|C|R)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Limp_Fold_vs_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Limp_Fold_vs_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Limp_Fold_vs_ISO_AI() {
        if (this.res) this.res.write("Preflop_HU_SB_Limp_Fold_vs_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
              AND LA_P.action = 'CF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
              AND LA_P.action SIMILAR TO 'C(F|C|R)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Limp_Fold_vs_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Limp_Fold_vs_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Limp_Call_vs_ISO_NAI() {
        if (this.res) this.res.write("Preflop_HU_SB_Limp_Call_vs_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'CC'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action SIMILAR TO 'C(F|C|R)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Limp_Call_vs_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Limp_Call_vs_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Limp_Call_vs_ISO_AI() {
        if (this.res) this.res.write("Preflop_HU_SB_Limp_Call_vs_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
              AND LA_P.action = 'CC'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_limp
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
              AND LA_P.action SIMILAR TO 'C(F|C|R)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Limp_Call_vs_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Limp_Call_vs_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Limp_Raise_AI_vs_ISO_NAI() {
        if (this.res) this.res.write("Preflop_HU_SB_Limp_Raise_AI_vs_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.amt_p_raise_facing <
                  tourney_hand_player_statistics.amt_p_effective_stack
              AND LA_P.action LIKE 'CR%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb)
                < tourney_hand_player_statistics.amt_p_effective_stack * 0.6
              AND LA_P.action SIMILAR TO 'C(F|C|R%)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Limp_Raise_AI_vs_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Limp_Raise_AI_vs_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_OR_2bb() {
        if (this.res) this.res.write("Preflop_HU_SB_OR_2bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb > 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_OR_2bb'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_OR_2bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Call_vs_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_HU_SB_Call_vs_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 2 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_P.action = 'RC'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 2 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_P.action SIMILAR TO 'R(F|C|R)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Call_vs_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Call_vs_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_Call_vs_3Bet_AI() {
        if (this.res) this.res.write("Preflop_HU_SB_Call_vs_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 2 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
              AND tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_P.action SIMILAR TO 'R(C|R)'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 2 * tourney_blinds.amt_bb) /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
              AND tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_P.action SIMILAR TO 'R(F|C|R)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_Call_vs_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_Call_vs_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_OR_more_2bb() {
        if (this.res) this.res.write("Preflop_HU_SB_OR_more_2bb")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.3
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_OR_more_2bb'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_OR_more_2bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_SB_OS() {
        if (this.res) this.res.write("Preflop_HU_SB_OS")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.3
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND tourney_hand_player_statistics.flg_p_open_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_SB_OS'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_SB_OS'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_EV() {
        if (this.res) this.res.write("Preflop_HU_BB_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_BB_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_BB_VPIP() {
        if (this.res) this.res.write("Preflop_HU_BB_VPIP")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_VPIP'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_VPIP'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_Limp_EV() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_Limp_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_BB_vs_SB_Limp_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_Limp_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_Limp_Check() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_Limp_Check")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2
              AND LA_P.action = 'X'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_Limp_Check'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_Limp_Check'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_Limp_ISO_NAI() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_Limp_ISO_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND NOT tourney_hand_player_statistics.enum_allin ILIKE 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_Limp_ISO_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_Limp_ISO_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_Limp_ISO_Fold() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_Limp_ISO_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND LA_P.action = 'RF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_3bet_def_opp
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_Limp_ISO_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_Limp_ISO_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_Limp_ISO_AI() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_Limp_ISO_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.flg_p_first_raise
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.cnt_p_face_limpers = 1
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 2.5
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_Limp_ISO_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_Limp_ISO_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_2bb_EV() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_2bb_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb = 2
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_BB_vs_SB_OR_2bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_2bb_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_2bb_Fold() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_2bb_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_blinds.amt_bb = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 4
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_blinds.amt_bb = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 4
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_2bb_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_2bb_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_2bb_Call() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_2bb_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_blinds.amt_bb = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 4
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) /
                  tourney_blinds.amt_bb = 2
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb >= 4
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_2bb_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_2bb_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_2bb_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_2bb_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb < 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_2bb_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_2bb_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_2bb_3Bet_AI() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_2bb_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) / tourney_blinds.amt_bb = 2
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb) / tourney_blinds.amt_bb = 2
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_2bb_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_2bb_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_more_2bb_EV() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_more_2bb_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_BB_vs_SB_OR_more_2bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_more_2bb_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_more_2bb_Fold() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_more_2bb_Fold")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
              AND LA_P.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack < 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_more_2bb_Fold'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_more_2bb_Fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_more_2bb_Call() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_more_2bb_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND LA_P.action = 'C'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_more_2bb_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_more_2bb_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_NAI() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_NAI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_NAI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_NAI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_AI() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_AI")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_3bet
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND tourney_hand_player_statistics.amt_p_raise_facing / tourney_blinds.amt_bb > 2
              AND tourney_hand_player_statistics.amt_p_raise_facing /
                  tourney_hand_player_statistics.amt_p_effective_stack <= 0.4
              AND tourney_hand_player_statistics.flg_p_3bet_opp
              AND tourney_hand_player_statistics.amt_p_raise_made /
                  tourney_hand_player_statistics.amt_p_effective_stack > 0.4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_AI'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OR_more_2bb_3Bet_AI'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OS_EV() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OS_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.flg_f_saw AND LA_F.id_action = 0
                OR NOT tourney_hand_player_statistics.flg_f_saw)
              AND tourney_hand_player_statistics.enum_allin ILIKE 'P'
              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) <= 2
              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) <= 3
        `);

        let result = a.rows[0].count;
        this.data['Preflop_HU_BB_vs_SB_OS_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OS_EV'] = `${a.rows[0].count}`;
    }

    async Preflop_HU_BB_vs_SB_OS_Call() {
        if (this.res) this.res.write("Preflop_HU_BB_vs_SB_OS_Call")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb)
                >= tourney_hand_player_statistics.amt_p_effective_stack
              AND LA_P.action SIMILAR TO 'C|R'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND tourney_hand_player_statistics.flg_p_face_raise
              AND (tourney_hand_player_statistics.amt_p_raise_facing + 1 * tourney_blinds.amt_bb)
                >= tourney_hand_player_statistics.amt_p_effective_stack
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Preflop_HU_BB_vs_SB_OS_Call'] = isNaN(result) ? 0 : result;
        this.formulas['Preflop_HU_BB_vs_SB_OS_Call'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_EV() {
        if (this.res) this.res.write("Postflop_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players BETWEEN 2 AND 3
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_IP_EV() {
        if (this.res) this.res.write("Postflop_Attack_IP_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players BETWEEN 2 AND 3
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_IP_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_EV() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_IP_3Max_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_EV() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_IP_HU_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_IP_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R'))
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (LA_F.action = 'X'
                            OR LA_F.action LIKE 'B%')
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R')
                        AND (LA_F.action = 'X'
                            OR LA_F.action LIKE 'B%'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (LA_F.action = 'X'
                OR LA_F.action LIKE 'B%')
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (LA_F.action = 'X'
                OR LA_F.action LIKE 'B%')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (LA_T.action = 'X'
                            OR LA_T.action LIKE 'B%')
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R')
                        AND (LA_T.action = 'X'
                            OR LA_T.action LIKE 'B%'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (LA_T.action = 'X'
                OR LA_T.action LIKE 'B%')
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (LA_T.action = 'X'
                OR LA_T.action LIKE 'B%')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (LA_R.action = 'X'
                            OR LA_R.action LIKE 'B%')
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                         ))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R')
                        AND (LA_R.action = 'X'
                            OR LA_R.action LIKE 'B%'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND (LA_R.action = 'X'
                OR LA_R.action LIKE 'B%')
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND tourney_hand_player_statistics.flg_r_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND tourney_hand_player_statistics.flg_t_bet
              AND (LA_R.action = 'X'
                OR LA_R.action LIKE 'B%')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Delay() {
        if (this.res) this.res.write("Postflop_Attack_IP_Delay")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (LA_T.action LIKE 'B%')
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R')
                        AND (LA_T.action LIKE 'B%'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (LA_T.action LIKE 'B%'
                            OR LA_T.action = 'X')
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R')
                        AND (LA_T.action LIKE 'B%'
                            OR LA_T.action = 'X'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Delay'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Delay() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Delay")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND LA_P.action = 'R'
                AND (LA_T.action LIKE 'B%')
                AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                    AND LA_P.action = 'R'
                    AND (LA_T.action LIKE 'B%'
                        OR LA_T.action = 'X')
                    AND (
                         (tourney_hand_player_statistics.position = 0
                             AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                             AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                             AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                         OR
                         (tourney_hand_player_statistics.position = 8
                             AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                     ))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Delay'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Delay() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Delay")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND (tourney_hand_player_statistics.cnt_players = 2
                AND (LA_P.action = 'C'
                    OR LA_P.action = 'R')
                AND (LA_T.action LIKE 'B%')
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND (tourney_hand_player_statistics.cnt_players = 2
                AND (LA_P.action = 'C'
                    OR LA_P.action = 'R')
                AND (LA_T.action LIKE 'B%'
                    OR LA_T.action = 'X'))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Delay'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Delay_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_Delay_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                AND LA_P.action = 'R'
                AND ((tourney_hand_player_statistics.position = 0
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                    AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                    AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 9
                    AND LA_P.action SIMILAR TO 'C|R'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                AND LA_P.action = 'R'
                AND ((tourney_hand_player_statistics.position = 0
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                    AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                    AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 9
                    AND LA_P.action SIMILAR TO 'C|R'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Delay_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Delay_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Delay_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Delay_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 0
                AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                OR (tourney_hand_player_statistics.position = 8
                    AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
              AND LA_P.action = 'R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 0
                AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                OR (tourney_hand_player_statistics.position = 8
                    AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
              AND LA_P.action = 'R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Delay_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Delay_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Delay_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Delay_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action LIKE 'B%'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Delay_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Delay_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Delay_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (
                             (tourney_hand_player_statistics.position = 0
                                 AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                 AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                 AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                             OR
                             (tourney_hand_player_statistics.position = 8
                                 AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                    OR
                    (tourney_hand_player_statistics.cnt_players = 2
                        AND (LA_P.action = 'C'
                            OR LA_P.action = 'R'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_check
              AND (tourney_hand_player_statistics.flg_r_bet
                OR tourney_hand_player_statistics.flg_r_check)
              AND (
                            tourney_hand_player_statistics.cnt_players = 3
                        AND LA_P.action = 'R'
                        AND (
                                    (tourney_hand_player_statistics.position = 0
                                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                                    OR
                                    (tourney_hand_player_statistics.position = 8
                                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                    OR
                            (tourney_hand_player_statistics.cnt_players = 2
                                AND (LA_P.action = 'C'
                                    OR LA_P.action = 'R'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Delay_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_check
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND tourney_hand_player_statistics.flg_t_check
              AND (tourney_hand_player_statistics.flg_r_bet
                OR tourney_hand_player_statistics.flg_r_check)
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Delay_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_B_X_B() {
        if (this.res) this.res.write("Postflop_Attack_IP_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                AND LA_P.action = 'R'
                AND ((tourney_hand_player_statistics.position = 0
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                    AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                    AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 9
                    AND LA_P.action SIMILAR TO 'C|R'))
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                AND LA_P.action = 'R'
                AND ((tourney_hand_player_statistics.position = 0
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                    AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                    AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 9
                    AND LA_P.action SIMILAR TO 'C|R'))
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_B_X_B() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 0
                AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                OR (tourney_hand_player_statistics.position = 8
                    AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 0
                AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                OR (tourney_hand_player_statistics.position = 8
                    AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
              AND LA_P.action = 'R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_B_X_B() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Fold_vs_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_Fold_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action = 'C'
                           OR LA_P.action = 'R'))
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO '(F|C|R%)'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action = 'C'
                           OR LA_P.action = 'R'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Fold_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Fold_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Fold_vs_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Fold_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'F'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO '(F|C|R%)'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Fold_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Fold_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Fold_vs_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Fold_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO '(F|C|R%)'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Fold_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Fold_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Raise_vs_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_Raise_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action LIKE 'R%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action = 'C'
                           OR LA_P.action = 'R'))
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO '(F|C|R%)'
              AND tourney_hand_player_statistics.amt_f_bet_facing < tourney_hand_player_statistics.amt_f_effective_stack
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action = 'C'
                           OR LA_P.action = 'R'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Raise_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Raise_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Raise_vs_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Raise_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action LIKE 'R%'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO '(F|C|R%)'
              AND tourney_hand_player_statistics.amt_f_bet_facing < tourney_hand_player_statistics.amt_f_effective_stack
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Raise_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Raise_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Raise_vs_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Raise_vs_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action LIKE 'R%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND (LA_P.action = 'C'
                OR LA_P.action = 'R')
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO '(F|C|R%)'
              AND tourney_hand_player_statistics.amt_f_bet_facing < tourney_hand_player_statistics.amt_f_effective_stack
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Raise_vs_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Raise_vs_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action SIMILAR TO 'C|R'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action SIMILAR TO 'F|C|R%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action SIMILAR TO 'C|R'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action = 'F'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action SIMILAR TO 'F|C|R%'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_Call_vs_Probe_Turn_and_Fold_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_Call_vs_Probe_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action SIMILAR TO 'C|R'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action = 'C'
              AND LA_R.action SIMILAR TO 'F|C|R%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action SIMILAR TO 'C|R'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_Call_vs_Probe_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_Call_vs_Probe_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_Call_vs_Probe_Turn_and_Fold_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_Call_vs_Probe_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_check
              AND LA_T.action = 'C'
              AND LA_R.action SIMILAR TO 'F|C|R%'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_Call_vs_Probe_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_Call_vs_Probe_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Call_vs_Probe_Turn_and_Fold_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Call_vs_Probe_Turn_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Call_vs_Probe_Turn_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Call_vs_Probe_Turn_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_B_X_F() {
        if (this.res) this.res.write("Postflop_Attack_IP_B_X_F")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action SIMILAR TO 'C|R'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action SIMILAR TO 'F|C|R%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND LA_P.action = 'R'
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                               AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                               AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9'))
                OR
                   (tourney_hand_player_statistics.cnt_players = 2
                       AND (LA_P.action SIMILAR TO 'C|R'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_B_X_F'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_B_X_F'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_3Max_B_X_F() {
        if (this.res) this.res.write("Postflop_Attack_IP_3Max_B_X_F")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action = 'F'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action SIMILAR TO 'F|C|R%'
              AND (
                    (tourney_hand_player_statistics.position = 0
                        AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 2
                        AND NOT tourney_hand_player_statistics.flg_p_3bet_def_opp
                        AND NOT tourney_hand_player_statistics.flg_p_squeeze_def_opp)
                    OR
                    (tourney_hand_player_statistics.position = 8
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '9')
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_3Max_B_X_F'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_3Max_B_X_F'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_B_X_F() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_B_X_F")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action SIMILAR TO 'C|R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND LA_P.action SIMILAR TO 'C|R'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_check
              AND LA_R.action SIMILAR TO 'F|C|R%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_B_X_F'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_B_X_F'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_X_X_F() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_X_X_F")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_X_X_F'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_X_X_F'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_HU_Bet_Fold_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_HU_Bet_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND LA_R.action = 'BF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'C|R'
              AND tourney_hand_player_statistics.flg_r_bet
              AND tourney_hand_player_statistics.amt_r_raise_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_HU_Bet_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_HU_Bet_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_EV() {
        if (this.res) this.res.write("Postflop_Attack_OOP_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_OOP_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_EV() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_OOP_3Max_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_EV() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_OOP_HU_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO 'X%|B%'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO 'X%|B%'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO 'X%|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action SIMILAR TO 'X%|B%'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action SIMILAR TO 'X%|B%'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action SIMILAR TO 'X%|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Bet_River")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X%|B%'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Bet_River")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X%|B%'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
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
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X%|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Delay() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Delay")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Delay'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Delay() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Delay")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Delay'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Delay() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Delay")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND LA_F.action = 'X'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND LA_F.action = 'X'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Delay'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Delay_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Delay_and_Bet_River")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'B%|X%'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Delay_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Delay_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Delay_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Delay_and_Bet_River")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'B%|X%'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Delay_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Delay_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Delay_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Delay_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
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
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'B%|X%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Delay_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Delay_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Delay_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Delay_River")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'B%|X%'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Delay_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Delay_River")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'B%|X%'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Delay_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'B%|X%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_B_X_B() {
        if (this.res) this.res.write("Postflop_Attack_OOP_B_X_B")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'B%|X%'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_B_X_B() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_B_X_B")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'B%|X%'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_B_X_B() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'B%|X%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Fold_vs_FloatBet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Fold_vs_FloatBet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'XF'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Fold_vs_FloatBet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Fold_vs_FloatBet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'XF'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND LA_F.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Fold_vs_FloatBet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Fold_vs_FloatBet_Turn")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'XF'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Fold_vs_FloatBet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Fold_vs_FloatBet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Turn")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'XF'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Fold_vs_FloatBet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Fold_vs_FloatBet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Fold_vs_FloatBet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'XF'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Fold_vs_FloatBet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Fold_vs_FloatBet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND LA_R.action = 'XF'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Fold_vs_FloatBet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Fold_vs_FloatBet_River() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Fold_vs_FloatBet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Fold_vs_FloatBet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Fold_vs_FloatBet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_Fold_vs_Probe_Turn")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'XF'
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (
                    (tourney_hand_player_statistics.cnt_players = 3
                         AND (tourney_hand_player_statistics.position = 9
                                  AND
                              (LA_P.action = 'C'
                                  AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                                  AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                            OR
                              (LA_P.action = 'R'
                                  AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                        OR (tourney_hand_player_statistics.position = 8
                            AND LA_P.action = 'R'
                            AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                    OR
                    tourney_hand_player_statistics.cnt_players = 2
                        AND tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_3Max_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_3Max_Fold_vs_Probe_Turn")

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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'XF'
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
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
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (
                (tourney_hand_player_statistics.cnt_players = 3
                     AND (tourney_hand_player_statistics.position = 9
                              AND
                          (LA_P.action = 'C'
                              AND CHAR_LENGTH(tourney_hand_summary.str_aggressors_p) = 1
                              AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 1)
                        OR
                          (LA_P.action = 'R'
                              AND tourney_hand_summary.str_actors_p NOT LIKE '098%'))
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action = 'R'
                        AND SUBSTRING(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_3Max_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_3Max_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_OOP_HU_Fold_vs_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Attack_OOP_HU_Fold_vs_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action = 'R'
              AND NOT tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_OOP_HU_Fold_vs_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_OOP_HU_Fold_vs_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_EV() {
        if (this.res) this.res.write("Postflop_Attack_IP_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players BETWEEN 2 AND 3
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Attack_IP_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_EV() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Defence_IP_3Max_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_EV() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.flg_f_has_position
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Defence_IP_HU_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Defence_IP_Fold_vs_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_IP_Fold_vs_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND LA_P.action SIMILAR TO 'X|C'))
                OR
                   tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND LA_P.action SIMILAR TO 'X|C'))
                OR
                   tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Fold_vs_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Fold_vs_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Fold_vs_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Fold_vs_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR
                     (tourney_hand_player_statistics.position = 8
                         AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Fold_vs_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Fold_vs_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Fold_vs_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Fold_vs_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Fold_vs_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Fold_vs_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Fold_vs_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_Fold_vs_Bet_Turn")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND LA_P.action SIMILAR TO 'X|C'))
                OR
                   tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND LA_P.action SIMILAR TO 'X|C'))
                OR
                   tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Fold_vs_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Fold_vs_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Fold_vs_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Fold_vs_Bet_Turn")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Fold_vs_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Fold_vs_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Fold_vs_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Fold_vs_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Fold_vs_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Fold_vs_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Fold_vs_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_Fold_vs_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Fold_vs_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Fold_vs_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Fold_vs_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Fold_vs_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Fold_vs_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Fold_vs_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Fold_vs_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Fold_vs_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Fold_vs_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Fold_vs_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_Fold_vs_Delay_Turn")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND LA_P.action SIMILAR TO 'X|C'))
                OR
                   tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0
                               AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR
                           (tourney_hand_player_statistics.position = 8
                               AND LA_P.action SIMILAR TO 'X|C'))
                OR
                   tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Fold_vs_Delay_Turn")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'F'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Call_vs_Delay_and_Fold_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_Call_vs_Delay_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Call_vs_Delay_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Call_vs_Delay_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Call_vs_Delay_and_Fold_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Call_vs_Delay_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Call_vs_Delay_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Call_vs_Delay_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Call_vs_Delay_and_Fold_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Call_vs_Delay_and_Fold_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Call_vs_Delay_and_Fold_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Call_vs_Delay_and_Fold_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Fold_vs_B_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_Fold_vs_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'X'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Fold_vs_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Fold_vs_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Fold_vs_B_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Fold_vs_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'X'
              AND LA_R.action = 'F'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Fold_vs_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Fold_vs_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Fold_vs_B_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Fold_vs_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'X'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Fold_vs_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Fold_vs_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Float_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_IP_Float_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Float_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Float_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Float_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Float_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND tourney_hand_player_statistics.flg_f_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Float_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Float_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Float_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Float_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND LA_F.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND LA_F.id_action != 0
              AND tourney_hand_player_statistics.amt_f_bet_facing = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Float_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Float_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Float_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_Float_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Float_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Float_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Float_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Float_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Float_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Float_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Float_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Float_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Float_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Float_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Float_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_Float_Bet_River")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Float_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Float_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Float_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Float_Bet_River")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Float_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Float_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Float_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Float_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND tourney_hand_player_statistics.flg_r_bet
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'C'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Float_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Float_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Float_Bet_Flop_and_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_Float_Bet_Flop_and_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Float_Bet_Flop_and_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Float_Bet_Flop_and_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Float_Bet_Flop_and_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Float_Bet_Flop_and_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Float_Bet_Flop_and_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Float_Bet_Flop_and_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Float_Bet_Flop_and_Turn() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Float_Bet_Flop_and_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'B'
              AND LA_T.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Float_Bet_Flop_and_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Float_Bet_Flop_and_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_Float_Call_Turn_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_Float_Call_Turn_and_Bet_River")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (
                           (tourney_hand_player_statistics.position = 0 AND LA_P.action = 'RC'
                               AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                           OR (tourney_hand_player_statistics.position = 8
                           AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_Float_Call_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_Float_Call_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_Float_Call_Turn_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_Float_Call_Turn_and_Bet_River")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_Float_Call_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_Float_Call_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_Float_Call_Turn_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_Float_Call_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
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
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'C'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_Float_Call_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_Float_Call_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.flg_t_bet
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_X_B_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_X_B_B")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_X_B_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_X_B_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_X_B_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_X_B_B")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_X_B_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_X_B_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_X_B_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_X_B_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
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
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_X_B_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_X_B_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_X_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_X_X_B")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 9
                       AND LA_P.action SIMILAR TO 'CC|RC'
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_X_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_X_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_3Max_X_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_3Max_X_X_B")

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
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'X|B%'
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 0
                    AND LA_P.action = 'RC'
                    AND CHAR_LENGTH(tourney_hand_summary.str_actors_p) = 3)
                    OR (tourney_hand_player_statistics.position = 8
                        AND LA_P.action SIMILAR TO 'X|C'))
                )
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_3Max_X_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_3Max_X_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_IP_HU_X_X_B() {
        if (this.res) this.res.write("Postflop_Defence_IP_HU_X_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.flg_r_bet
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 9
              AND LA_P.action SIMILAR TO 'CC|RC'
              AND tourney_hand_player_statistics.flg_f_has_position
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND LA_R.action SIMILAR TO 'X|B%'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_IP_HU_X_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_IP_HU_X_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_EV() {
        if (this.res) this.res.write("Postflop_Defence_OOP_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND ((tourney_hand_player_statistics.position = 8
                                 AND (LA_P.action = 'C'
                        AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08')
                    OR (LA_P.action = 'X'
                        AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                        AND ((LA_P.action = 'C'
                            AND char_length(tourney_hand_summary.str_actors_p) = 2
                            AND char_length(tourney_hand_summary.str_aggressors_p) = 2)
                            OR (LA_P.action = 'C'
                                AND tourney_hand_player_statistics.cnt_p_face_limpers = 1)
                            OR (LA_P.action SIMILAR TO 'RC|CC'
                                AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 3) = '989'))))
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 8
                       AND LA_P.action SIMILAR TO 'X|C'
                )
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Defence_OOP_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_EV() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
              AND (tourney_hand_player_statistics.cnt_players = 3
                AND ((tourney_hand_player_statistics.position = 8
                          AND (LA_P.action = 'C'
                        AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 2) = '08')
                    OR (LA_P.action = 'X'
                        AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 1) = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                        AND ((LA_P.action = 'C'
                            AND char_length(tourney_hand_summary.str_actors_p) = 2
                            AND char_length(tourney_hand_summary.str_aggressors_p) = 2)
                            OR (LA_P.action = 'C'
                                AND tourney_hand_player_statistics.cnt_p_face_limpers = 1)
                            OR (LA_P.action SIMILAR TO 'RC|CC'
                                AND substring(tourney_hand_summary.str_actors_p FROM 1 FOR 3) = '989'))))
                )
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Defence_OOP_3Max_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_EV() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_EV")

        let a = await this.DB.query(`
            SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb) * 100
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND (tourney_hand_player_statistics.flg_f_saw
                AND LA_F.id_action != 0)
        `);

        let result = a.rows[0].count;
        this.data['Postflop_Defence_OOP_HU_EV'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_EV'] = `${a.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Fold_vs_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Fold_vs_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND LA_F.action LIKE 'XF'
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (tourney_hand_player_statistics.position = 8
                                AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action LIKE 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989')
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 8
                       AND LA_P.action SIMILAR TO 'X|C')
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND (tourney_hand_player_statistics.cnt_players = 3
                       AND (tourney_hand_player_statistics.position = 8
                                AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action LIKE 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989')
                OR tourney_hand_player_statistics.cnt_players = 2
                       AND tourney_hand_player_statistics.position = 8
                       AND LA_P.action SIMILAR TO 'X|C')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Fold_vs_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Fold_vs_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Fold_vs_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Fold_vs_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND LA_F.action LIKE 'XF'
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action LIKE 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action LIKE 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action LIKE 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action LIKE 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Fold_vs_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Fold_vs_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Fold_vs_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Fold_vs_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Fold_vs_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Fold_vs_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Fold_vs_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Fold_vs_Bet_Turn")

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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND (tourney_hand_player_statistics.position = 8
                                 AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                       AND LA_P.action SIMILAR TO 'X|C')
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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND (tourney_hand_player_statistics.position = 8
                                 AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                       AND LA_P.action SIMILAR TO 'X|C')
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Fold_vs_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Fold_vs_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Fold_vs_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Fold_vs_Bet_Turn")

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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Fold_vs_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Fold_vs_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Fold_vs_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Fold_vs_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XF'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XC'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Fold_vs_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Fold_vs_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Fold_vs_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Fold_vs_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND (tourney_hand_player_statistics.position = 8
                                 AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                       AND LA_P.action SIMILAR TO 'X|C')
              AND LA_F.action = 'XC'
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
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND (tourney_hand_player_statistics.position = 8
                                 AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                       AND LA_P.action SIMILAR TO 'X|C')
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Fold_vs_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Fold_vs_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Fold_vs_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Fold_vs_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XC'
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
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Fold_vs_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Fold_vs_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Fold_vs_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Fold_vs_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XC'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Fold_vs_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Fold_vs_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_XR_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_XR_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action LIKE 'XR%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_XR_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_XR_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_XR_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_XR_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action LIKE 'XR%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_XR_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_XR_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_XR_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_XR_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE 'XR%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND tourney_hand_player_statistics.amt_f_bet_facing > 0
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'F'
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_XR_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_XR_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_XR_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_XR_Flop_and_Bet_Turn")

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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'XR'
              AND length(tourney_hand_summary.str_actors_f) = 3
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'XR'
              AND length(tourney_hand_summary.str_actors_f) = 3
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_XR_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_XR_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_XR_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_XR_Flop_and_Bet_Turn")

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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XR'
              AND length(tourney_hand_summary.str_actors_f) = 3
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XR'
              AND length(tourney_hand_summary.str_actors_f) = 3
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_XR_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_XR_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_XR_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_XR_Flop_and_Bet_Turn")

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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XR'
              AND length(tourney_hand_summary.str_actors_f) = 3
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XR'
              AND length(tourney_hand_summary.str_actors_f) = 3
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_XR_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_XR_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Fold_vs_Delay_Turn")

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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Fold_vs_Delay_Turn")

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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Fold_vs_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Fold_vs_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Fold_vs_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Fold_vs_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Call_Turn_and_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Call_Turn_and_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
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
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Call_Turn_and_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Call_Turn_and_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Call_Turn_and_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Call_Turn_and_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
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
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Call_Turn_and_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Call_Turn_and_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Call_Turn_and_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Call_Turn_and_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'XC'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Call_Turn_and_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Call_Turn_and_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
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
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
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
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Fold_vs_Delay_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Fold_vs_Delay_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Fold_vs_Delay_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Fold_vs_Delay_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Probe_Turn")

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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Probe_Turn")

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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Probe_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Probe_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Probe_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Probe_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Probe_Turn_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Probe_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Probe_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Probe_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Probe_Turn_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Probe_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Probe_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Probe_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Probe_Turn_and_Bet_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Probe_Turn_and_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.action LIKE 'B%'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'X'
              AND LA_T.action = 'B'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Probe_Turn_and_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Probe_Turn_and_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Call_Flop_and_Probe_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Call_Flop_and_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Call_Flop_and_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Call_Flop_and_Probe_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Call_Flop_and_Probe_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Call_Flop_and_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Call_Flop_and_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Call_Flop_and_Probe_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Call_Flop_and_Probe_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Call_Flop_and_Probe_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND LA_R.action LIKE 'B%'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XC'
              AND LA_T.action = 'X'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Call_Flop_and_Probe_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Call_Flop_and_Probe_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.action LIKE 'B%'
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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND LA_F.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.action LIKE 'B%'
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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND LA_F.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Donk_Flop() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Donk_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Donk_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Donk_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_Donk_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_Donk_Flop_and_Bet_Turn")

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
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_F.action = 'B'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND ((tourney_hand_player_statistics.cnt_players = 3
                        AND ((tourney_hand_player_statistics.position = 8
                                  AND (LA_P.action = 'C'
                        AND tourney_hand_summary.str_actors_p = '08')
                    OR (LA_P.action = 'X'
                        AND tourney_hand_summary.str_actors_p = '0'))
                    OR (tourney_hand_player_statistics.position = 9
                            AND (LA_P.action LIKE 'C'
                            AND tourney_hand_summary.str_actors_p = '09')
                        OR LA_P.action SIMILAR TO 'CC|RC'
                            AND tourney_hand_summary.str_actors_p = '989'))
                OR (tourney_hand_player_statistics.cnt_players = 2
                    AND tourney_hand_player_statistics.position = 8)
                        AND LA_P.action SIMILAR TO 'X|C'))
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_F.action = 'B'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_Donk_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_Donk_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_3Max_Donk_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_3Max_Donk_Flop_and_Bet_Turn")

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
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_F.action = 'B'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND ((tourney_hand_player_statistics.position = 8
                        AND (LA_P.action = 'C'
                    AND tourney_hand_summary.str_actors_p = '08')
                OR (LA_P.action = 'X'
                    AND tourney_hand_summary.str_actors_p = '0'))
                OR (tourney_hand_player_statistics.position = 9
                        AND (LA_P.action LIKE 'C'
                        AND tourney_hand_summary.str_actors_p = '09')
                    OR LA_P.action SIMILAR TO 'CC|RC'
                        AND tourney_hand_summary.str_actors_p = '989'))
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_F.action = 'B'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_3Max_Donk_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_3Max_Donk_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Donk_Flop_and_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Donk_Flop_and_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_F.action = 'B'
              AND LA_T.action LIKE 'B%'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND NOT tourney_hand_player_statistics.enum_face_allin ILIKE 'P'
              AND LA_F.action = 'B'
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Donk_Flop_and_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Donk_Flop_and_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Donk_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Donk_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE '%C'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE '%C'
              ANd LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Donk_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Donk_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Donk_River() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Donk_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_T.action LIKE '%C'
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_T.action LIKE '%C'
              ANd LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Donk_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Donk_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Fold_vs_B_X_B() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Fold_vs_B_X_B")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE '%C'
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
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action LIKE '%C'
              AND LA_T.action = 'X'
              AND tourney_hand_player_statistics.amt_r_bet_facing > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Fold_vs_B_X_B'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Fold_vs_B_X_B'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Check_Raise_Turn() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Check_Raise_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_T.action LIKE 'XR%'
              AND (tourney_hand_player_statistics.amt_t_bet_facing + 1 * tourney_blinds.amt_bb)
                < tourney_hand_player_statistics.amt_t_effective_stack
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND tourney_hand_player_statistics.amt_t_bet_facing > 0
              AND (tourney_hand_player_statistics.amt_t_bet_facing + 1 * tourney_blinds.amt_bb)
                < tourney_hand_player_statistics.amt_t_effective_stack
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Check_Raise_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Check_Raise_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Defence_OOP_HU_Check_Raise_and_Bet_Bet() {
        if (this.res) this.res.write("Postflop_Defence_OOP_HU_Check_Raise_and_Bet_Bet")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN lookup_actions AS LA_P ON tourney_hand_player_statistics.id_action_p = LA_P.id_action
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XR'
              AND LA_T.action = 'B'
              AND LA_R.action = 'B'
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
              AND tourney_hand_player_statistics.cnt_players = 2
              AND tourney_hand_player_statistics.position = 8
              AND LA_P.action SIMILAR TO 'X|C'
              AND LA_F.action = 'XR'
              AND LA_T.action = 'B'
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Defence_OOP_HU_Check_Raise_and_Bet_Bet'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Defence_OOP_HU_Check_Raise_and_Bet_Bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_BTN_Bet_Flop() {
        if (this.res) this.res.write("Postflop_Attack_IP_BTN_Bet_Flop")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_f = 2
              AND LA_F.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_f = 2
              AND tourney_hand_player_statistics.amt_f_bet_facing = 0
              AND LA_F.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_BTN_Bet_Flop'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_BTN_Bet_Flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_BTN_Bet_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_BTN_Bet_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_t = 2
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_t = 2
              AND tourney_hand_player_statistics.amt_t_bet_facing = 0
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_BTN_Bet_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_BTN_Bet_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_BTN_Bet_River() {
        if (this.res) this.res.write("Postflop_Attack_IP_BTN_Bet_River")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_r = 2
              AND LA_R.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_R ON tourney_hand_player_statistics.id_action_r = LA_R.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_r = 2
              AND tourney_hand_player_statistics.amt_r_bet_facing = 0
              AND LA_R.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_BTN_Bet_River'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_BTN_Bet_River'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async Postflop_Attack_IP_BTN_Delay_Turn() {
        if (this.res) this.res.write("Postflop_Attack_IP_BTN_Delay_Turn")

        let a = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_f = 2
              AND LA_F.action = 'X'
              AND LA_T.action LIKE 'B%'
        `);

        let b = await this.DB.query(`
            SELECT COUNT(*)
            FROM tourney_hand_player_statistics
                     INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
                     INNER JOIN tourney_blinds ON tourney_hand_player_statistics.id_blinds = tourney_blinds.id_blinds
                     INNER JOIN tourney_hand_summary
                                ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
                     INNER JOIN lookup_actions AS LA_F ON tourney_hand_player_statistics.id_action_f = LA_F.id_action
                     INNER JOIN lookup_actions AS LA_T ON tourney_hand_player_statistics.id_action_t = LA_T.id_action
            WHERE ${this.check_str}
              AND tourney_hand_player_statistics.cnt_players = 3
              AND tourney_hand_player_statistics.position = 0
              AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb = 2
              AND tourney_hand_summary.cnt_players_f = 2
              AND LA_F.action = 'X'
              AND tourney_hand_player_statistics.amt_t_bet_facing = 0
              AND LA_T.id_action != 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['Postflop_Attack_IP_BTN_Delay_Turn'] = isNaN(result) ? 0 : result;
        this.formulas['Postflop_Attack_IP_BTN_Delay_Turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }
}
