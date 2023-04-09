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
        this.matrix = {}
        this.check_str = main_str(this.room_names, date_1, date_2)
        this.check2_str = case_str(this.room_names, date_1, date_2)
        this.room_names_for_query = get_room_names(this.room_names)
        this.line_chart_data = []
        this.left_table_data = []
        this.DB = db
    }

    // async left_table() {
    //     let a = await this.DB.query(`SELECT player_name, site_abbrev, buyin, COUNT(id_tourney) as tourney_count, SUM(buyin) as sum_buyin, SUM(amt_won) as amt_won
    //                             FROM (SELECT *
    //                             FROM (SELECT DISTINCT ON(TS.id_tourney) TS.id_tourney, LS.site_abbrev, TS.tourney_no, TS.date_start, TTT.val_flags, TTT.val_speed, TTT.description, TR.flg_sat_seat, (TS.amt_buyin+TS.amt_fee) as buyin, THPS.id_hand, THPS.amt_before, THPS.amt_ante, TB.amt_bb, (THPS.amt_before / TB.amt_bb) as startstack, TR.amt_won, PL.player_name
    //                             FROM  tourney_summary as TS, tourney_hand_player_statistics as THPS, player as PL, tourney_blinds as TB, lookup_sites as LS, tourney_table_type as TTT, tourney_results as TR
    //                             WHERE (${this.room_names_for_query}) AND
    //                             THPS.id_player = PL.id_player AND
    //                             THPS.id_tourney = TS.id_tourney AND
    //                             TB.amt_bb > 0 AND
    //                             TB.id_blinds = THPS.id_blinds AND
    //                             TS.id_site = LS.id_site AND
    //                             TS.id_table_type = TTT.id_table_type AND
    //                             THPS.id_tourney = TR.id_tourney AND
    //                             TR.date_start BETWEEN '${this.date_1}' AND '${this.date_2}'
    //                             ORDER BY TS.id_tourney, THPS.id_hand DESC) foo
    //                             WHERE amt_before / amt_bb < 50) foo1
    //                             GROUP BY player_name, site_abbrev, buyin
    //                             ORDER BY player_name ASC, site_abbrev ASC, buyin ASC`)
    //     this.left_table_data = [...a.rows]
    // }
    //
    async line_chart() {
        // let a = await this.DB.query(`SELECT THPS.id_hand, THPS.amt_won/TB.amt_bb AS amt_won, THPS.amt_expected_won/TB.amt_bb AS amt_expected_won
        //                         FROM tourney_summary as TS, tourney_hand_player_statistics as THPS, player as PL, tourney_blinds as TB
        //                         WHERE (${this.room_names_for_query})
        //                         AND THPS.date_played BETWEEN '${this.date_1}' AND '${this.date_2}'
        //                         AND THPS.id_player = PL.id_player
        //                         AND THPS.id_tourney = TS.id_tourney
        //                         AND TB.id_blinds = THPS.id_blinds
        //                         ORDER BY THPS.id_hand ASC`)
        //
        // let currentAmtWon = 0;
        // let currentAmtExpectedWon = 0;
        // let rows = JSON.parse(JSON.stringify(a.rows));
        //
        // if (rows[0]) {
        //     rows.forEach((e, i) => {
        //         currentAmtWon = currentAmtWon + +e.amt_won;
        //         currentAmtExpectedWon = currentAmtExpectedWon + +e.amt_expected_won;
        //         e.amt_won = currentAmtWon;
        //         e.amt_expected_won = currentAmtExpectedWon;
        //     });
        //     rows = [{id_hand: 1, amt_won: 0, amt_expected_won: 0}, ...rows];
        //
        //     let result_graph_length = 300;
        //     let filter_step = Math.floor(rows.length / result_graph_length);
        //     let result_array = rows.map((item, index) => {
        //         if (!((index + 1) % filter_step)) {
        //             return {...item, step: filter_step}
        //         }
        //     });
        //
        //     result_array = result_array.filter(e => e != undefined);
        //
        //     this.line_chart_data = [...result_array]
        // } else {
        //     this.line_chart_data = []
        // }

        this.res.write("line_chart")

        let a = await this.DB.query(`SELECT THPS.id_hand, THPS.amt_won/TB.amt_bb AS amt_won, THPS.amt_expected_won/TB.amt_bb AS amt_expected_won, THPS.flg_showdown
                            FROM tourney_summary as TS, tourney_hand_player_statistics as THPS, player as PL, tourney_blinds as TB
                            WHERE (${this.room_names_for_query})
                            AND THPS.date_played BETWEEN '${this.date_1}' AND '${this.date_2}'
                            AND THPS.id_player = PL.id_player
                            AND THPS.id_tourney = TS.id_tourney
                            AND TB.id_blinds = THPS.id_blinds
                            ORDER BY THPS.id_hand ASC`)

        let currentAmtWon = 0;
        let currentAmtExpectedWon = 0;
        let blue_line = 0;
        let red_line = 0;
        let rows = JSON.parse(JSON.stringify(a.rows));

        if (rows[0]) {
            rows.forEach((e, i) => {
                if (e.flg_showdown){
                    blue_line = blue_line + +e.amt_won;
                } else {
                    red_line = red_line + +e.amt_won;
                }
                e.blue_line = blue_line;
                e.red_line = red_line;
                currentAmtWon = currentAmtWon + +e.amt_won;
                currentAmtExpectedWon = currentAmtExpectedWon + +e.amt_expected_won;
                e.amt_won = currentAmtWon;
                e.amt_expected_won = currentAmtExpectedWon;
            });
            rows = [{id_hand: 1, amt_won: 0, amt_expected_won: 0, blue_line: 0, red_line: 0}, ...rows];

            let result_graph_length = 300;
            let filter_step = Math.floor(rows.length / result_graph_length);
            let result_array = rows.map((item, index) => {
                if (!((index + 1) % filter_step)) {
                    return {...item, step: filter_step}
                }
            });

            result_array = result_array.filter(e => e != undefined);

            this.line_chart_data = [...result_array]
        } else {
            this.line_chart_data = []
        }
    }

    async count_hands() {
        this.res.write("count_hands")

        let a = await this.DB.query(`SELECT COUNT(tourney_hand_player_statistics.id_hand)
        FROM tourney_hand_player_statistics, player
        WHERE ${this.check_str} 
        AND tourney_hand_player_statistics.id_player = player.id_player`);

        let result = a.rows[0].count;
        this.data['count_hands'] = isNaN(result) ? 0 : result;
        this.formulas['count_hands'] = `${a.rows[0].count}`;
    }

    async ev_total() {
        this.res.write("ev_total")

        let a = await this.DB.query(`SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100 
        FROM tourney_hand_player_statistics INNER JOIN player 
ON tourney_hand_player_statistics.id_player = player.id_player
INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE ${this.check_str}`);

        this.data['ev_total'] = a.rows[0]["?column?"];
        this.formulas['ev_total'] = `${a.rows[0]["?column?"]}`;
    }

    async ev_bb_199_ss_60() {
        this.res.write("ev_bb_199_ss_60")
        let a = await this.DB.query(`SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
                                FROM(
                                SELECT(SUM(CASE WHEN(TB.amt_bb > 199 
                                and (THPS.amt_before - THPS.amt_ante) / TB.amt_bb <= 60) 
                                THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
                                (SUM(CASE WHEN(TB.amt_bb > 199
                                and (THPS.amt_before - THPS.amt_ante) / TB.amt_bb <= 60) 
                                THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['ev_bb_199_ss_60'] = isNaN(result) ? 0 : result;
        this.formulas['ev_bb_199_ss_60'] = `${a.rows[0]["result"]}`;
    }

    async ev_bb_999() {
        this.res.write("ev_bb_999")
        let a = await this.DB.query(`
        SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
        FROM(
        SELECT	(SUM(CASE WHEN(
        TB.amt_bb > 999
        ) 
        THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
        (SUM(CASE WHEN(
        TB.amt_bb > 999
        ) 
        THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['ev_bb_999'] = isNaN(result) ? 0 : result;
        this.formulas['ev_bb_999'] = `${a.rows[0]["result"]}`;
    }

    async ev_bb_4999() {
        this.res.write("ev_bb_4999")
        let a = await this.DB.query(`
        SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
        FROM(
        SELECT	(SUM(CASE WHEN(
        TB.amt_bb > 4999
        ) 
        THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
        (SUM(CASE WHEN(
        TB.amt_bb > 4999
        ) 
        THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['ev_bb_4999'] = isNaN(result) ? 0 : result;
        this.formulas['ev_bb_4999'] = `${a.rows[0]["result"]}`;
    }

    async ev_bb_25_ss() {
        this.res.write("ev_bb_25_ss")
        let a = await this.DB.query(`SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
        FROM(
        SELECT (SUM(CASE WHEN(
            (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 25) 
                THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
                (SUM(CASE WHEN(
                    (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 25)
                     THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['ev_bb_25_ss'] = isNaN(result) ? 0 : result;
        this.formulas['ev_bb_25_ss'] = `${a.rows[0]["result"]}`;
    }

    async ev_bb_25_60_ss() {
        this.res.write("ev_bb_25_60_ss")
        let a = await this.DB.query(`SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
        FROM(
        SELECT (SUM(CASE WHEN(
            (THPS.amt_before - THPS.amt_ante) / TB.amt_bb >= 25 
            and (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 60) 
                THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
                (SUM(CASE WHEN(
                    (THPS.amt_before - THPS.amt_ante) / TB.amt_bb >= 25 
                               and (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 60) THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['ev_bb_25_60_ss'] = isNaN(result) ? 0 : result;
        this.formulas['ev_bb_25_60_ss'] = `${a.rows[0]["result"]}`;
    }

    async ev_bb_60_ss() {
        this.res.write("ev_bb_60_ss")
        let a = await this.DB.query(`SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
        FROM(
        SELECT (SUM(CASE WHEN(
            (THPS.amt_before - THPS.amt_ante) / TB.amt_bb >= 60) 
                THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
                (SUM(CASE WHEN(
                    (THPS.amt_before - THPS.amt_ante) / TB.amt_bb >= 60)
                     THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['ev_bb_60_ss'] = isNaN(result) ? 0 : result;
        this.formulas['ev_bb_60_ss'] = `${a.rows[0]["result"]}`;
    }

    async __ev_bb_unopend_total_50bb() {
        this.res.write("__ev_bb_unopend_total_50bb")
        let a = await this.DB.query(`SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
                                FROM(
                                SELECT(SUM(CASE WHEN(
                                char_length(THS.str_aggressors_p) = 1 
                                and (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 50
                                ) 
                                                                THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
                                                                (SUM(CASE WHEN(
                                char_length(THS.str_aggressors_p) = 1 
                                and (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 50
                                ) 
                                THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['__ev_bb_unopend_total_50bb'] = isNaN(result) ? 0 : result;
        this.formulas['__ev_bb_unopend_total_50bb'] = `${a.rows[0]["result"]}`;
    }

    async __ev_bb_vs_1r_total_50bb() {
        this.res.write("__ev_bb_vs_1r_total_50bb")
        let a = await this.DB.query(`SELECT (CASE WHEN ActionOpportunities = 0 THEN 0 ELSE (CAST(ActionCount AS REAL)/(ActionOpportunities)*100) END) AS result
                                FROM(
                                SELECT(SUM(CASE WHEN(
                                substring(THS.str_aggressors_p from 2 for 1) = substring(THS.str_actors_p from 1 for 1) and
                                             (substring(THS.str_actors_p from 2 for 1) = CAST(THPS.position as VARCHAR(9)) or LA.action = 'F') and
                                              THPS.amt_p_2bet_facing > 0 and
                                              THPS.amt_p_3bet_facing = 0 and
                                               THPS.amt_p_4bet_facing = 0 and THPS.amt_p_5bet_facing = 0 and
                                                (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 50
                                ) 
                                                                THEN THPS.amt_expected_won / TB.amt_bb ELSE 0 END)) AS ActionCount,
                                                                (SUM(CASE WHEN(
                                substring(THS.str_aggressors_p from 2 for 1) = substring(THS.str_actors_p from 1 for 1) and
                                             (substring(THS.str_actors_p from 2 for 1) = CAST(THPS.position as VARCHAR(9)) or LA.action = 'F') and
                                              THPS.amt_p_2bet_facing > 0 and
                                              THPS.amt_p_3bet_facing = 0 and
                                               THPS.amt_p_4bet_facing = 0 and THPS.amt_p_5bet_facing = 0 and
                                                (THPS.amt_before - THPS.amt_ante) / TB.amt_bb < 50
                                ) 
                                THEN 1 ELSE 0 END)) AS ActionOpportunities ${this.check2_str}`);
        let result = a.rows[0]["result"];
        this.data['__ev_bb_vs_1r_total_50bb'] = isNaN(result) ? 0 : result;
        this.formulas['__ev_bb_vs_1r_total_50bb'] = `${a.rows[0]["result"]}`;
    }

    async count_torney() {
        this.res.write("count_torney")
        let a = await this.DB.query(`SELECT COUNT(distinct tourney_hand_player_statistics.id_tourney) 
FROM tourney_hand_player_statistics INNER JOIN player 
ON tourney_hand_player_statistics.id_player = player.id_player
INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
WHERE ${this.check_str}`);
        let result = a.rows[0].count;
        this.data['count_torney'] = isNaN(result) ? 0 : result;
        this.formulas['count_torney'] = `${a.rows[0].count}`;
    }

    async wwsf() {
        this.res.write("wwsf")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_won_hand 
        AND tourney_hand_player_statistics.flg_f_saw`);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_f_saw
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['wwsf'] = isNaN(result) ? 0 : result;
        this.formulas['wwsf'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async wtsd() {
        this.res.write("wtsd")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_f
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_showdown
        AND lookup_actions.action != ''
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_f
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_f_saw
        AND lookup_actions.action != ''
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['wtsd'] = isNaN(result) ? 0 : result;
        this.formulas['wtsd'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async wasd() {
        this.res.write("wasd")
        let a = await this.DB.query(`SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_showdown 
        AND tourney_hand_player_statistics.flg_won_hand
        `);

        let b = await this.DB.query(`SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_showdown 
        `);


        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['wasd'] = isNaN(result) ? 0 : result;
        this.formulas['wasd'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip() {
        this.res.write("vpip")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_vpip
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip'] = isNaN(result) ? 0 : result;
        this.formulas['vpip'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    // Пенсионный фонд россии?
    async pfr() {
        this.res.write("pfr")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.id_hand > 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['pfr'] = isNaN(result) ? 0 : result;
        this.formulas['pfr'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async rfi_wai_ep() {
        this.res.write("rfi_wai_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7 
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)*0.8
        AND tourney_hand_player_statistics.flg_p_first_raise 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7 
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before)
        `);

        let c = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp
        AND lookup_actions.action = 'F'
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let d = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['rfi_wai_ep'] = isNaN(result) ? 0 : result;
        this.formulas['rfi_wai_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
        this.matrix['rfi_wai_ep'] = isNaN(result) ? 0 : result;
    }

    async rfi_wai_mp() {
        this.res.write("rfi_wai_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 4
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)*0.8
        AND tourney_hand_player_statistics.flg_p_first_raise 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 4
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before)
        `);

        let c = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp
        AND lookup_actions.action = 'F'
        AND tourney_hand_player_statistics.position = 4
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let d = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['rfi_wai_mp'] = isNaN(result) ? 0 : result;
        this.formulas['rfi_wai_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
        this.matrix['rfi_wai_mp'] = isNaN(result) ? 0 : result;
    }

    async rfi_wai_mp1() {
        this.res.write("rfi_wai_mp1")
        let a = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 3
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)*0.8
        AND tourney_hand_player_statistics.flg_p_first_raise 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 3
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before)
        `);

        let c = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp
        AND lookup_actions.action = 'F'
        AND tourney_hand_player_statistics.position = 3
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let d = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['rfi_wai_mp1'] = isNaN(result) ? 0 : result;
        this.formulas['rfi_wai_mp1'] = `${a.rows[0].count} / ${b.rows[0].count}`;
        this.matrix['rfi_wai_mp1'] = isNaN(result) ? 0 : result;
    }

    async rfi_wai_hj() {
        this.res.write("rfi_wai_hj")
        let a = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 2
        AND (tourney_hand_player_statistics.amt_p_raise_made / (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)) < 0.5
        AND tourney_hand_player_statistics.flg_p_first_raise 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 2
        AND (tourney_hand_player_statistics.amt_p_raise_made / (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)) < 0.5
        `);

        let c = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp
        AND lookup_actions.action = 'F'
        AND tourney_hand_player_statistics.position = 2
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let d = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['rfi_wai_hj'] = isNaN(result) ? 0 : result;
        this.formulas['rfi_wai_hj'] = `${a.rows[0].count} / ${b.rows[0].count}`;
        this.matrix['rfi_wai_hj'] = isNaN(result) ? 0 : result;
    }

    async rfi_wai_co() {
        this.res.write("rfi_wai_co")
        let a = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 1
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)*0.8
        AND tourney_hand_player_statistics.flg_p_first_raise 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 1
        AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before)
        `);

        let c = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp
        AND lookup_actions.action = 'F'
        AND tourney_hand_player_statistics.position = 1
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let d = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['rfi_wai_co'] = isNaN(result) ? 0 : result;
        this.formulas['rfi_wai_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
        this.matrix['rfi_wai_co'] = isNaN(result) ? 0 : result;
    }

    async rfi_wai_bu() {
        this.res.write("rfi_wai_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 0
        AND (tourney_hand_player_statistics.amt_p_raise_made / (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)) < 0.5
        AND tourney_hand_player_statistics.flg_p_first_raise 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*) 
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
        AND tourney_hand_player_statistics.position = 0
        AND (tourney_hand_player_statistics.amt_p_raise_made / (tourney_hand_player_statistics.amt_before - tourney_hand_player_statistics.amt_ante)) < 0.5
        `);

        let c = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp
        AND lookup_actions.action = 'F'
        AND tourney_hand_player_statistics.position = 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let d = await this.DB.query(`
        SELECT lookup_hole_cards.hole_cards, COUNT(lookup_hole_cards.hole_cards)
        FROM tourney_hand_player_statistics
        INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard
        AND tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_raise > 0
        GROUP BY lookup_hole_cards.hole_cards
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['rfi_wai_bu'] = isNaN(result) ? 0 : result;
        this.formulas['rfi_wai_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
        this.matrix['rfi_wai_bu'] = isNaN(result) ? 0 : result;
    }

    async foldvs3bet_wai_ep() {
        this.res.write("foldvs3bet_wai_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
		AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
		AND char_length(tourney_hand_summary.str_actors_p) <= 3 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs3bet_wai_ep'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs3bet_wai_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs3bet_wai_mp() {
        this.res.write("foldvs3bet_wai_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 4
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
		AND char_length(tourney_hand_summary.str_actors_p) <= 3 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 4
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs3bet_wai_mp'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs3bet_wai_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs3bet_wai_mp1() {
        this.res.write("foldvs3bet_wai_mp1")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 3
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
		AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
		AND char_length(tourney_hand_summary.str_actors_p) <= 3 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 3
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs3bet_wai_mp1'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs3bet_wai_mp1'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs3bet_wai_hj() {
        this.res.write("foldvs3bet_wai_hj")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 2
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
		AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
		AND char_length(tourney_hand_summary.str_actors_p) <= 3 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 2
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs3bet_wai_hj'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs3bet_wai_hj'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs3bet_wai_co() {
        this.res.write("foldvs3bet_wai_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 1
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
		AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
		AND char_length(tourney_hand_summary.str_actors_p) <= 3 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 1
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs3bet_wai_co'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs3bet_wai_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs3bet_wai_bu() {
        this.res.write("foldvs3bet_wai_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 0
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
		AND tourney_hand_player_statistics.enum_p_3bet_action = 'F'
		AND char_length(tourney_hand_summary.str_actors_p) <= 3 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary    
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
		INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.position = 0
		AND tourney_hand_player_statistics.flg_p_first_raise
        AND tourney_hand_player_statistics.flg_p_3bet_def_opp
		AND NOT((tourney_hand_player_statistics.enum_face_allin = 'p') or (tourney_hand_player_statistics.enum_face_allin = 'P'))
		AND (substring(tourney_hand_summary.str_actors_p from 1 for 1) = substring(tourney_hand_summary.str_actors_p from 3 for 1) or
			substring(tourney_hand_summary.str_actors_p from 3 for 1) = '')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs3bet_wai_bu'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs3bet_wai_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_cc_ep() {
        this.res.write("vs1r_wai_cc_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb ) < 5
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + 1 * tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
		AND lookup_actions.action LIKE 'C%'
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND (((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '5') AND tourney_hand_player_statistics.position = 5)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '6') AND tourney_hand_player_statistics.position = 6)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '7') AND tourney_hand_player_statistics.position = 7))
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_cc_ep'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_cc_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_cc_mp() {
        this.res.write("vs1r_wai_cc_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb ) < 5
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + 1 * tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
		AND lookup_actions.action LIKE 'C%'
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND (((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '2') AND tourney_hand_player_statistics.position = 2)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '3') AND tourney_hand_player_statistics.position = 3)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '4') AND tourney_hand_player_statistics.position = 4))
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_cc_mp'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_cc_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_cc_co() {
        this.res.write("vs1r_wai_cc_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb ) < 5
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + 1 * tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
		AND lookup_actions.action LIKE 'C%'
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 1
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_cc_co'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_cc_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_cc_bu() {
        this.res.write("vs1r_wai_cc_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb ) < 5
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + 1 * tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
		AND lookup_actions.action LIKE 'C%'
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 0
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_cc_bu'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_cc_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_cc_sb() {
        this.res.write("vs1r_wai_cc_sb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb ) < 5
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
		AND lookup_actions.action LIKE 'C%'
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '9'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_cc_sb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_cc_sb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_cc_bb() {
        this.res.write("vs1r_wai_cc_bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb ) < 5
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + 2 * tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
		AND lookup_actions.action LIKE 'C%'
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '8'
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_cc_bb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_cc_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betwai_ep() {
        this.res.write("vs1r_wai_3betwai_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND (((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '5') AND tourney_hand_player_statistics.position = 5)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '6') AND tourney_hand_player_statistics.position = 6)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '7') AND tourney_hand_player_statistics.position = 7))
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betwai_ep'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betwai_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betwai_mp() {
        this.res.write("vs1r_wai_3betwai_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND (((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '2') AND tourney_hand_player_statistics.position = 2)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '3') AND tourney_hand_player_statistics.position = 3)
		or ((substring(tourney_hand_summary.str_actors_p from 2 for 1) = '4') AND tourney_hand_player_statistics.position = 4))
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betwai_mp'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betwai_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betwai_co() {
        this.res.write("vs1r_wai_3betwai_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 1
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betwai_co'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betwai_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betwai_bu() {
        this.res.write("vs1r_wai_3betwai_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 0
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betwai_bu'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betwai_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betwai_sb() {
        this.res.write("vs1r_wai_3betwai_sb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '9'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betwai_sb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betwai_sb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betwai_bb() {
        this.res.write("vs1r_wai_3betwai_bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '8'
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betwai_bb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betwai_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betai_greater8_ep() {
        this.res.write("vs1r_wai_3betai_greater8_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_3bet
		AND (tourney_hand_player_statistics.amt_before/tourney_blinds.amt_bb) > 8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
		AND (tourney_hand_player_statistics.enum_allin='p' or tourney_hand_player_statistics.enum_allin='P')
		AND tourney_hand_player_statistics.enum_face_allin = 'N'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb) > 8
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betai_greater8_ep'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betai_greater8_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betai_greater8_mp() {
        this.res.write("vs1r_wai_3betai_greater8_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb) > 8
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betai_greater8_mp'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betai_greater8_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betai_greater8_co() {
        this.res.write("vs1r_wai_3betai_greater8_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_3bet
		AND (tourney_hand_player_statistics.amt_before/tourney_blinds.amt_bb) > 8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 1
		AND (tourney_hand_player_statistics.enum_allin='p' or tourney_hand_player_statistics.enum_allin='P')
		AND tourney_hand_player_statistics.enum_face_allin = 'N'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb) > 8
        AND tourney_hand_player_statistics.position = 1
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betai_greater8_co'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betai_greater8_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betai_greater8_bu() {
        this.res.write("vs1r_wai_3betai_greater8_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_3bet
		AND (tourney_hand_player_statistics.amt_before/tourney_blinds.amt_bb) > 8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 0
		AND (tourney_hand_player_statistics.enum_allin='p' or tourney_hand_player_statistics.enum_allin='P')
		AND tourney_hand_player_statistics.enum_face_allin = 'N'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb) > 8
        AND tourney_hand_player_statistics.position = 0
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betai_greater8_bu'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betai_greater8_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betai_greater8_sb() {
        this.res.write("vs1r_wai_3betai_greater8_sb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_3bet
		AND (tourney_hand_player_statistics.amt_before/tourney_blinds.amt_bb) > 8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '9'
		AND tourney_hand_player_statistics.position = 9
		AND (tourney_hand_player_statistics.enum_allin='p' or tourney_hand_player_statistics.enum_allin='P')
		AND tourney_hand_player_statistics.enum_face_allin = 'N'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb) > 8
        AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betai_greater8_sb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betai_greater8_sb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_3betai_greater8_bb() {
        this.res.write("vs1r_wai_3betai_greater8_bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_summary 
		INNER JOIN tourney_hand_player_statistics ON tourney_hand_player_statistics.id_hand = tourney_hand_summary.id_hand
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN lookup_hole_cards ON lookup_hole_cards.id_holecard = tourney_hand_player_statistics.id_holecard and tourney_hand_player_statistics.id_gametype = lookup_hole_cards.id_gametype
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_3bet
		AND (tourney_hand_player_statistics.amt_before/tourney_blinds.amt_bb) > 8
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND substring(tourney_hand_summary.str_actors_p from 2 for 1) = '8'
		AND tourney_hand_player_statistics.position = 8
		AND (tourney_hand_player_statistics.enum_allin='p' or tourney_hand_player_statistics.enum_allin='P')
		AND tourney_hand_player_statistics.enum_face_allin = 'N'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_blinds.amt_bb ) < tourney_hand_player_statistics.amt_before
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb) > 8
        AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_player_statistics.flg_p_3bet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_3betai_greater8_bb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_3betai_greater8_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    //squeze
    async vs1r_wai_squezze_cc_ep() {
        this.res.write("vs1r_wai_squezze_cc_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND lookup_actions.action LIKE 'C%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_cc_ep'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_cc_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_cc_mp() {
        this.res.write("vs1r_wai_squezze_cc_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND lookup_actions.action LIKE 'C%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_cc_mp'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_cc_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_cc_co() {
        this.res.write("vs1r_wai_squezze_cc_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND lookup_actions.action LIKE 'C%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_cc_co'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_cc_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_cc_bu() {
        this.res.write("vs1r_wai_squezze_cc_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND lookup_actions.action LIKE 'C%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_cc_bu'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_cc_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_cc_sb() {
        this.res.write("vs1r_wai_squezze_cc_sb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND lookup_actions.action LIKE 'C%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_cc_sb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_cc_sb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_cc_bb() {
        this.res.write("vs1r_wai_squezze_cc_bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND lookup_actions.action LIKE 'C%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_cc_bb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_cc_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_wai_ep() {
        this.res.write("vs1r_wai_squezze_wai_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze
		AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before * 0.8)
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_wai_ep'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_wai_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_wai_mp() {
        this.res.write("vs1r_wai_squezze_wai_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze
		AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before * 0.8)
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_wai_mp'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_wai_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_wai_co() {
        this.res.write("vs1r_wai_squezze_wai_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze
		AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before * 0.8)
        AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_wai_co'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_wai_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_wai_bu() {
        this.res.write("vs1r_wai_squezze_wai_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze
		AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before * 0.8)
        AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_wai_bu'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_wai_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_wai_sb() {
        this.res.write("vs1r_wai_squezze_wai_sb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze
		AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before * 0.8)
        AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_wai_sb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_wai_sb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_wai_squezze_wai_bb() {
        this.res.write("vs1r_wai_squezze_wai_bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze
		AND tourney_hand_player_statistics.amt_p_raise_made < (tourney_hand_player_statistics.amt_before * 0.8)
        AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_wai_squezze_wai_bb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_wai_squezze_wai_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_ai_squezze_greater8_ai_ep() {
        this.res.write("vs1r_ai_squezze_greater8_ai_ep")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND lookup_actions.action LIKE 'R%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made >= tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 8
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb ) > 8
        AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_ai_squezze_greater8_ai_ep'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_ai_squezze_greater8_ai_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_ai_squezze_greater8_ai_mp() {
        this.res.write("vs1r_ai_squezze_greater8_ai_mp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND lookup_actions.action LIKE 'R%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made >= tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 8
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb ) > 8
        AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_ai_squezze_greater8_ai_mp'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_ai_squezze_greater8_ai_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_ai_squezze_greater8_ai_co() {
        this.res.write("vs1r_ai_squezze_greater8_ai_co")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND lookup_actions.action LIKE 'R%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made >= tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 8
        AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb ) > 8
        AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_ai_squezze_greater8_ai_co'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_ai_squezze_greater8_ai_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_ai_squezze_greater8_ai_bu() {
        this.res.write("vs1r_ai_squezze_greater8_ai_bu")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND lookup_actions.action LIKE 'R%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made >= tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 8
        AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb ) > 8
        AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_ai_squezze_greater8_ai_bu'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_ai_squezze_greater8_ai_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_ai_squezze_greater8_ai_sb() {
        this.res.write("vs1r_ai_squezze_greater8_ai_sb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND lookup_actions.action LIKE 'R%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made >= tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 8
        AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb ) > 8
        AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_ai_squezze_greater8_ai_sb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_ai_squezze_greater8_ai_sb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vs1r_ai_squezze_greater8_ai_bb() {
        this.res.write("vs1r_ai_squezze_greater8_ai_bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
        AND lookup_actions.action LIKE 'R%'
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.flg_p_3bet
        AND tourney_hand_player_statistics.amt_p_raise_made >= tourney_hand_player_statistics.amt_p_effective_stack
        AND tourney_hand_player_statistics.amt_p_raise_made / tourney_blinds.amt_bb > 8
        AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.flg_p_squeeze_opp
		AND (tourney_hand_player_statistics.amt_before / tourney_blinds.amt_bb ) > 8
        AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vs1r_ai_squezze_greater8_ai_bb'] = isNaN(result) ? 0 : result;
        this.formulas['vs1r_ai_squezze_greater8_ai_bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_ep_vs_open_2_4_bb_less28bb() {
        this.res.write("vpip_ep_vs_open_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_ep_vs_open_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_ep_vs_open_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_ep_2_4_bb_less28bb() {
        this.res.write("vpip_mp_vs_ep_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_ep_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_ep_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_mp_2_4_bb_less28bb() {
        this.res.write("vpip_mp_vs_mp_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_mp_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_mp_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_ep_2_4_bb_less28bb() {
        this.res.write("vpip_co_vs_ep_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_ep_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_ep_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_mp_2_4_bb_less28bb() {
        this.res.write("vpip_co_vs_mp_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_mp_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_mp_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_ep_2_4_bb_less28bb() {
        this.res.write("vpip_bu_vs_ep_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_ep_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_ep_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_mp_2_4_bb_less28bb() {
        this.res.write("vpip_bu_vs_mp_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_mp_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_mp_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_co_2_4_bb_less28bb() {
        this.res.write("vpip_bu_vs_co_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'	
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_co_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_co_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_ep_2_4_bb_less28bb() {
        this.res.write("vpip_sb_vs_ep_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_ep_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_ep_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_mp_2_4_bb_less28bb() {
        this.res.write("vpip_sb_vs_mp_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_mp_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_mp_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_co_2_4_bb_less28bb() {
        this.res.write("vpip_sb_vs_co_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_co_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_co_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_bu_2_4_bb_less28bb() {
        this.res.write("vpip_sb_vs_bu_2_4_bb_less28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_bu_2_4_bb_less28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_bu_2_4_bb_less28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    //great28bb

    async vpip_ep_vs_open_2_4_bb_great28bb() {
        this.res.write("vpip_ep_vs_open_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_ep_vs_open_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_ep_vs_open_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_ep_2_4_bb_great28bb() {
        this.res.write("vpip_mp_vs_ep_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_ep_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_ep_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_mp_2_4_bb_great28bb() {
        this.res.write("vpip_mp_vs_mp_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_mp_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_mp_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_ep_2_4_bb_great28bb() {
        this.res.write("vpip_co_vs_ep_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_ep_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_ep_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_mp_2_4_bb_great28bb() {
        this.res.write("vpip_co_vs_mp_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_mp_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_mp_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_ep_2_4_bb_great28bb() {
        this.res.write("vpip_bu_vs_ep_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_ep_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_ep_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_mp_2_4_bb_great28bb() {
        this.res.write("vpip_bu_vs_mp_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_mp_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_mp_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_co_2_4_bb_great28bb() {
        this.res.write("vpip_bu_vs_co_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'	
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_co_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_co_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_ep_2_4_bb_great28bb() {
        this.res.write("vpip_sb_vs_ep_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_ep_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_ep_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_mp_2_4_bb_great28bb() {
        this.res.write("vpip_sb_vs_mp_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_mp_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_mp_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_co_2_4_bb_great28bb() {
        this.res.write("vpip_sb_vs_co_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_co_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_co_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_bu_2_4_bb_great28bb() {
        this.res.write("vpip_sb_vs_bu_2_4_bb_great28bb")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_bu_2_4_bb_great28bb'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_bu_2_4_bb_great28bb'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_ep() {
        this.res.write("foldvs1R_2_4_bb_vs_ep")
        let a = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_ep'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_ep'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_mp() {
        this.res.write("foldvs1R_2_4_bb_vs_mp")
        let a = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_mp'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_mp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_co() {
        this.res.write("foldvs1R_2_4_bb_vs_co")
        let a = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_co'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_co'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_bu() {
        this.res.write("foldvs1R_2_4_bb_vs_bu")
        let a = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT  COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_bu'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_bu'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    //bvb sb
    async bvb_sb_raise() {
        this.res.write("bvb_sb_raise")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND lookup_actions.action LIKE 'R%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_raise'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_raise'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_limp() {
        this.res.write("bvb_sb_limp")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND lookup_actions.action LIKE 'C%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_limp'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_limp'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_limp_fold() {
        this.res.write("bvb_sb_limp_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND lookup_actions.action = 'CF'
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_player_statistics.flg_p_face_raise
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_limp_fold'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_limp_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_limp_raise() {
        this.res.write("bvb_sb_limp_raise")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND lookup_actions.action = 'CR'
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_player_statistics.flg_p_face_raise
		AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_limp_raise'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_limp_raise'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_iso() {
        this.res.write("bvb_bb_iso")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and tourney_hand_player_statistics.cnt_p_face_limpers = 1 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		and lookup_actions.action Like 'R%'
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and tourney_hand_player_statistics.cnt_p_face_limpers = 1 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_iso'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_iso'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_fold_vs_raise_less2_4() {
        this.res.write("bvb_bb_fold_vs_raise_less2_4")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_fold_vs_raise_less2_4'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_fold_vs_raise_less2_4'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_fold_vs_raise_less2_8() {
        this.res.write("bvb_bb_fold_vs_raise_less2_8")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
        and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.4
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.8
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.4
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.8
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_fold_vs_raise_less2_8'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_fold_vs_raise_less2_8'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_fold_vs_raise_less3_7() {
        this.res.write("bvb_bb_fold_vs_raise_less3_7")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
        and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2.7
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2.7
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_fold_vs_raise_less3_7'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_fold_vs_raise_less3_7'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }


    async total_flop_cbet() {
        this.res.write("total_flop_cbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND tourney_hand_player_statistics.flg_f_has_position
        AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7`);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND NOT(tourney_hand_player_statistics.flg_p_3bet)
		AND NOT(tourney_hand_player_statistics.flg_p_4bet)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_flop_cbet'] = isNaN(result) ? 0 : result;
        this.formulas['total_flop_cbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_turn_cbet() {
        this.res.write("total_turn_cbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
		${this.check_str}
		AND tourney_hand_player_statistics.flg_t_cbet
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
		${this.check_str}
		AND tourney_hand_player_statistics.flg_t_cbet_opp
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_turn_cbet'] = isNaN(result) ? 0 : result;
        this.formulas['total_turn_cbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_river_cbet() {
        this.res.write("total_river_cbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.flg_t_bet
		AND tourney_hand_player_statistics.flg_r_bet
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.flg_t_bet
		AND tourney_hand_player_statistics.flg_r_open_opp
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_river_cbet'] = isNaN(result) ? 0 : result;
        this.formulas['total_river_cbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_flop_fold_and_check_fold() {
        this.res.write("total_flop_fold_and_check_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_f
        WHERE
        ${this.check_str}
        AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.enum_f_cbet_action='F'`);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_f
        WHERE
        ${this.check_str}
        AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_f_cbet_def_opp
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_flop_fold_and_check_fold'] = isNaN(result) ? 0 : result;
        this.formulas['total_flop_fold_and_check_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_turn_fold_and_check_fold() {
        this.res.write("total_turn_fold_and_check_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_t
        WHERE
        ${this.check_str}
		AND (lookup_actions.action SIMILAR TO '(F|XF)%')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
             `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_t
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_t_bet_facing > 0
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_turn_fold_and_check_fold'] = isNaN(result) ? 0 : result;
        this.formulas['total_turn_fold_and_check_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_river_fold_and_check_fold() {
        this.res.write("total_river_fold_and_check_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_r
        WHERE
        ${this.check_str}
		AND (lookup_actions.action SIMILAR TO '(F|XF)%')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
             `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_r
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.amt_r_bet_facing > 0
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_river_fold_and_check_fold'] = isNaN(result) ? 0 : result;
        this.formulas['total_river_fold_and_check_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_flop_bet_vs_misscbet() {
        this.res.write("total_flop_bet_vs_misscbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
		${this.check_str}
		AND (lookup_actions.action = 'C' OR lookup_actions.action = 'CC')
		AND tourney_hand_player_statistics.flg_p_face_raise 
		AND tourney_hand_player_statistics.flg_f_bet
		AND tourney_hand_summary.cnt_players_f = 2
		AND ((substring(tourney_hand_summary.str_aggressors_p from 2 for 1)::int > tourney_hand_player_statistics.position) OR (tourney_hand_summary.cnt_players = 2 AND tourney_hand_player_statistics.flg_f_has_position))
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        WHERE
		${this.check_str}
		AND (lookup_actions.action = 'C' OR lookup_actions.action = 'CC')
		AND tourney_hand_player_statistics.flg_p_face_raise 
		AND tourney_hand_player_statistics.flg_f_open_opp 
		AND tourney_hand_summary.cnt_players_f = 2
		AND ((tourney_hand_summary.cnt_players > 2 AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1)::int > tourney_hand_player_statistics.position) OR (tourney_hand_summary.cnt_players = 2 AND tourney_hand_player_statistics.flg_f_has_position))
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_flop_bet_vs_misscbet'] = isNaN(result) ? 0 : result;
        this.formulas['total_flop_bet_vs_misscbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_turn_bet_vs_misscbet() {
        this.res.write("total_turn_bet_vs_misscbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_t
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.flg_t_float
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_t
        WHERE
        ${this.check_str}
		AND tourney_hand_player_statistics.flg_t_float_opp
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_turn_bet_vs_misscbet'] = isNaN(result) ? 0 : result;
        this.formulas['total_turn_bet_vs_misscbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_river_bet_vs_misscbet() {
        this.res.write("total_river_bet_vs_misscbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON id_action = tourney_hand_player_statistics.id_action_t
        WHERE
        ${this.check_str}
		AND LA1.action Like '%C'
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 and tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_r_bet
		AND tourney_hand_player_statistics.flg_r_has_position
		AND NOT(substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9' AND  tourney_hand_player_statistics.position = '9')
		AND NOT(tourney_hand_player_statistics.position = '8' AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND LA1.action Like '%C'
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 and tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_r_open_opp
		AND tourney_hand_player_statistics.flg_r_has_position
		AND NOT(substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9' AND  tourney_hand_player_statistics.position = '9')
		AND NOT(tourney_hand_player_statistics.position = '8' AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9')
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_river_bet_vs_misscbet'] = isNaN(result) ? 0 : result;
        this.formulas['total_river_bet_vs_misscbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_turn_probe() {
        this.res.write("total_turn_probe")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND tourney_hand_player_statistics.flg_t_bet 
		AND LA2.action LIKE 'X' 
		AND LA1.action NOT LIKE '%R' 
		AND tourney_hand_player_statistics.flg_p_face_raise 
		AND ((tourney_hand_summary.cnt_players >= 3 
			  and tourney_hand_player_statistics.val_p_raise_aggressor_pos < tourney_hand_player_statistics.position) 
			 OR (tourney_hand_summary.cnt_players = 2 and tourney_hand_player_statistics.flg_blind_b))
		AND NOT(substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9' AND  tourney_hand_player_statistics.position = '9')
		AND NOT(tourney_hand_player_statistics.position = '8' AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 and tourney_hand_summary.cnt_players_f = 2
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND tourney_hand_player_statistics.flg_t_open_opp 
		AND LA2.action LIKE 'X' 
		AND LA1.action NOT LIKE '%R' 
		AND tourney_hand_player_statistics.flg_p_face_raise 
		AND ((tourney_hand_summary.cnt_players >= 3 
			  and tourney_hand_player_statistics.val_p_raise_aggressor_pos < tourney_hand_player_statistics.position) 
			 OR (tourney_hand_summary.cnt_players = 2 
				 and tourney_hand_player_statistics.flg_blind_b))
		AND NOT(substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9' AND  tourney_hand_player_statistics.position = '9')
		AND NOT(tourney_hand_player_statistics.position = '8' AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 and tourney_hand_summary.cnt_players_f = 2
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_turn_probe'] = isNaN(result) ? 0 : result;
        this.formulas['total_turn_probe'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_river_probe() {
        this.res.write("total_river_probe")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND tourney_hand_player_statistics.flg_r_bet 
		AND LA2.action LIKE 'X' 
		AND LA1.action NOT LIKE '%R' 
		AND tourney_hand_player_statistics.flg_p_face_raise 
		AND ((tourney_hand_summary.cnt_players >= 3 
			  and tourney_hand_player_statistics.val_p_raise_aggressor_pos < tourney_hand_player_statistics.position) 
			 OR (tourney_hand_summary.cnt_players = 2 and tourney_hand_player_statistics.flg_blind_b))
		AND NOT(substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9' AND  tourney_hand_player_statistics.position = '9')
		AND NOT(tourney_hand_player_statistics.position = '8' AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 and tourney_hand_summary.cnt_players_f = 2
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND tourney_hand_player_statistics.flg_r_open_opp 
		AND LA2.action LIKE 'X' 
		AND LA1.action NOT LIKE '%R' 
		AND tourney_hand_player_statistics.flg_p_face_raise 
		AND ((tourney_hand_summary.cnt_players >= 3 
			  and tourney_hand_player_statistics.val_p_raise_aggressor_pos < tourney_hand_player_statistics.position) 
			 OR (tourney_hand_summary.cnt_players = 2 
				 and tourney_hand_player_statistics.flg_blind_b))
		AND NOT(substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9' AND  tourney_hand_player_statistics.position = '9')
		AND NOT(tourney_hand_player_statistics.position = '8' AND substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '9')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 and tourney_hand_summary.cnt_players_f = 2
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_river_probe'] = isNaN(result) ? 0 : result;
        this.formulas['total_river_probe'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_turn_delay() {
        this.res.write("total_turn_delay")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_t_bet 
		AND tourney_hand_player_statistics.flg_f_cbet_opp 
		AND LA2.action = 'X'
		AND LA1.action Like 'R'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_t_open_opp 
		AND tourney_hand_player_statistics.flg_f_cbet_opp 
		AND LA2.action = 'X'
		AND LA1.action Like 'R'
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_turn_delay'] = isNaN(result) ? 0 : result;
        this.formulas['total_turn_delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async total_river_delay() {
        this.res.write("total_river_delay")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_player_statistics.flg_r_bet 
		AND (tourney_hand_player_statistics.amt_r_bet_made > 0) 
		AND tourney_hand_player_statistics.flg_f_cbet_opp 
		AND LA1.action='X' 
		AND LA2.action='X'
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_player_statistics.flg_r_open_opp 
		AND tourney_hand_player_statistics.flg_f_cbet_opp 
		AND LA1.action='X' 
		AND LA2.action='X'
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['total_river_delay'] = isNaN(result) ? 0 : result;
        this.formulas['total_river_delay'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_flop_bet() {
        this.res.write("raiser_oop_flop_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet_opp 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_flop_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_flop_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_bet() {
        this.res.write("raiser_oop_turn_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_t_bet 
		AND NOT(tourney_hand_player_statistics.flg_t_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND (tourney_hand_player_statistics.flg_t_bet or tourney_hand_player_statistics.flg_t_check)
		AND NOT(tourney_hand_player_statistics.flg_t_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_bet() {
        this.res.write("raiser_oop_river_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_r_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND (tourney_hand_player_statistics.flg_r_bet or tourney_hand_player_statistics.flg_r_check)
		AND NOT(tourney_hand_player_statistics.flg_t_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_flop_check_raise() {
        this.res.write("raiser_oop_flop_check_raise")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'XR%' and tourney_hand_player_statistics.amt_f_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'X%' and tourney_hand_player_statistics.amt_f_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_flop_check_raise'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_flop_check_raise'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_check_raise() {
        this.res.write("raiser_oop_turn_check_raise")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'XR%' and tourney_hand_player_statistics.amt_t_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'X%' and tourney_hand_player_statistics.amt_t_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_check_raise'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_check_raise'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_check_raise() {
        this.res.write("raiser_oop_river_check_raise")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'XR%' and tourney_hand_player_statistics.amt_r_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'X%' and tourney_hand_player_statistics.amt_r_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_check_raise'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_check_raise'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_flop_check_fold() {
        this.res.write("raiser_oop_flop_check_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'XF%' and tourney_hand_player_statistics.amt_f_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7

        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'X%' and tourney_hand_player_statistics.amt_f_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_flop_check_fold'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_flop_check_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_check_fold() {
        this.res.write("raiser_oop_turn_check_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'XF%' and tourney_hand_player_statistics.amt_t_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'X%' and tourney_hand_player_statistics.amt_t_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_check_fold'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_check_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_check_fold() {
        this.res.write("raiser_oop_river_check_fold")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'XF%' and tourney_hand_player_statistics.amt_r_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		and LA1.action Like 'X%' and tourney_hand_player_statistics.amt_r_bet_facing > 0 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_check_fold'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_check_fold'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_cbet_aftercbet() {
        this.res.write("raiser_oop_turn_cbet_aftercbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND tourney_hand_player_statistics.flg_t_cbet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND tourney_hand_player_statistics.flg_t_cbet_opp 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_cbet_aftercbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_cbet_aftercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_bet_afterXXflop() {
        this.res.write("raiser_oop_turn_bet_afterXXflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_t_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_bet_afterXXflop'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_bet_afterXXflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_XF_aftercbet() {
        this.res.write("raiser_oop_turn_XF_aftercbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND LA1.action LIKE 'XF'
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND (LA1.action LIKE 'XC' or LA1.action LIKE 'XR' or LA1.action LIKE 'XF')
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_XF_aftercbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_XF_aftercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_turn_XF_afterXXflop() {
        this.res.write("raiser_oop_turn_XF_afterXXflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
 		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND LA2.action LIKE 'XF'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND (LA2.action LIKE 'XC' or LA2.action LIKE 'XR' or LA2.action LIKE 'XF')
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_turn_XF_afterXXflop'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_turn_XF_afterXXflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_cbet_after_cbflop_cbturn() {
        this.res.write("raiser_oop_river_cbet_after_cbflop_cbturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND tourney_hand_player_statistics.flg_t_cbet 
		AND tourney_hand_player_statistics.flg_r_cbet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
	    WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND tourney_hand_player_statistics.flg_t_cbet
		AND tourney_hand_player_statistics.flg_r_cbet_opp 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_cbet_after_cbflop_cbturn'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_cbet_after_cbflop_cbturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_bet_after_cbetflop_XXturn() {
        this.res.write("raiser_oop_river_bet_after_cbetflop_XXturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_f_cbet
		AND LA1.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet
		AND LA1.action LIKE 'X'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_bet_after_cbetflop_XXturn'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_bet_after_cbetflop_XXturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_bet_after_XXflop_betturn() {
        this.res.write("raiser_oop_river_bet_after_XXflop_betturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_t_bet 
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_t_bet
		AND LA2.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_bet_after_XXflop_betturn'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_bet_after_XXflop_betturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_bet_after_XXflop_XXturn() {
        this.res.write("raiser_oop_river_bet_after_XXflop_XXturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND LA2.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'X'
		AND LA2.action LIKE 'X'
		AND LA3.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_bet_after_XXflop_XXturn'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_bet_after_XXflop_XXturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_oop_river_XF_after_XCflop_XCturn() {
        this.res.write("raiser_oop_river_XF_after_XCflop_XCturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'XC'
		AND LA2.action LIKE 'XC'
		AND LA3.action LIKE 'XF'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA1.action LIKE 'XC'
		AND LA2.action LIKE 'XC'
		AND (LA3.action LIKE 'XC%' or LA3.action LIKE 'XF%' or LA3.action LIKE 'XR%')
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_oop_river_XF_after_XCflop_XCturn'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_oop_river_XF_after_XCflop_XCturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_flop_donk() {
        this.res.write("caller_oop_flop_donk")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_donk
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_donk_opp
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_flop_donk'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_flop_donk'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_donk() {
        this.res.write("caller_oop_turn_donk")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_T.action LIKE 'B%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_T.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_donk'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_donk'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_donk() {
        this.res.write("caller_oop_river_donk")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_R.action LIKE 'B%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_R.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_donk'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_donk'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_flop_XFvsBet() {
        this.res.write("caller_oop_flop_XFvsBet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XF%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_P
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND (LA_F.action LIKE 'XF%' or LA_F.action LIKE 'XR%' or LA_F.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_flop_XFvsBet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_flop_XFvsBet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_XFvsBet() {
        this.res.write("caller_oop_turn_XFvsBet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_T.action LIKE 'XF%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_P
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND (LA_T.action LIKE 'XF%' or LA_T.action LIKE 'XR%' or LA_T.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_XFvsBet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_XFvsBet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_XFvsBet() {
        this.res.write("caller_oop_river_XFvsBet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_R.action LIKE 'XF%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND (LA_R.action LIKE 'XF%' or LA_R.action LIKE 'XR%' or LA_R.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_XFvsBet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_XFvsBet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_flop_XRvsBet() {
        this.res.write("caller_oop_flop_XRvsBet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_P
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XR%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_P
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND (LA_F.action LIKE 'XF%' or LA_F.action LIKE 'XR%' or LA_F.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_flop_XRvsBet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_flop_XRvsBet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_XRvsBet() {
        this.res.write("caller_oop_turn_XRvsBet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_T.action LIKE 'XR%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND (LA_T.action LIKE 'XF%' or LA_T.action LIKE 'XR%' or LA_T.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_XRvsBet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_XRvsBet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_XRvsBet() {
        this.res.write("caller_oop_river_XRvsBet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_R.action LIKE 'XR%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND (LA_R.action LIKE 'XF%' or LA_R.action LIKE 'XR%' or LA_R.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_XRvsBet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_XRvsBet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_cbet_after_XRflop() {
        this.res.write("caller_oop_turn_cbet_after_XRflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XR%'
		AND tourney_hand_player_statistics.flg_t_bet
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XR'
		AND LA_T.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_cbet_after_XRflop'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_cbet_after_XRflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_bet_after_XXflop() {
        this.res.write("caller_oop_turn_bet_after_XXflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_t_bet
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_bet_after_XXflop'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_bet_after_XXflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_donk_after_XCflop() {
        this.res.write("caller_oop_turn_donk_after_XCflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC%'
		AND tourney_hand_player_statistics.flg_t_bet
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC%'
		AND LA_T.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_donk_after_XCflop'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_donk_after_XCflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_XR_after_XCflop() {
        this.res.write("caller_oop_turn_XR_after_XCflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC%'
		AND LA_T.action LIKE 'XR%'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC%'
		AND (LA_T.action LIKE 'XF%' or LA_T.action LIKE 'XR%' or LA_T.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_XR_after_XCflop'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_XR_after_XCflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_XF_after_XXflop() {
        this.res.write("caller_oop_turn_XF_after_XXflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'XF'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND (LA_T.action LIKE 'XF%' or LA_T.action LIKE 'XR%' or LA_T.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_XF_after_XXflop'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_XF_after_XXflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_turn_XF_after_XCflop() {
        this.res.write("caller_oop_turn_XF_after_XCflop")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC%'
		AND LA_T.action LIKE 'XF'
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC%'
		AND (LA_T.action LIKE 'XF%' or LA_T.action LIKE 'XR%' or LA_T.action LIKE 'XC%')  
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_turn_XF_after_XCflop'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_turn_XF_after_XCflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_cbet_after_XRflop_Bturn() {
        this.res.write("caller_oop_river_cbet_after_XRflop_Bturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XR%'
		AND LA_T.action LIKE 'B'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XR%'
		AND LA_T.action LIKE 'B'
		AND LA_R.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_cbet_after_XRflop_Bturn'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_cbet_after_XRflop_Bturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_cbet_after_XXflop_Bturn() {
        this.res.write("caller_oop_river_cbet_after_XXflop_Bturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'B'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'B'
		AND LA_R.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_cbet_after_XXflop_Bturn'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_cbet_after_XXflop_Bturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_cbet_after_XXflop_XXturn() {
        this.res.write("caller_oop_river_cbet_after_XXflop_XXturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'X'
		AND LA_R.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_cbet_after_XXflop_XXturn'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_cbet_after_XXflop_XXturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_cbet_after_XCflop_XXturn() {
        this.res.write("caller_oop_river_cbet_after_XCflop_XXturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC'
		AND LA_T.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC'
		AND LA_T.action LIKE 'X'
		AND LA_R.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_cbet_after_XCflop_XXturn'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_cbet_after_XCflop_XXturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_oop_river_cbet_after_XCflop_XCturn() {
        this.res.write("caller_oop_river_cbet_after_XCflop_XCturn")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC'
		AND LA_T.action LIKE 'XC'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XC'
		AND LA_T.action LIKE 'XC'
		AND LA_R.action <> ''
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1' 
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6'
			 OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_oop_river_cbet_after_XCflop_XCturn'] = isNaN(result) ? 0 : result;
        this.formulas['caller_oop_river_cbet_after_XCflop_XCturn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_bet() {
        this.res.write("raiser_ip_flop_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet_opp 
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_turn_bet() {
        this.res.write("raiser_ip_turn_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND LA_P.action LIKE 'R'
		AND LA_T.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_t_bet 
		AND tourney_hand_player_statistics.flg_t_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND LA_P.action LIKE 'R'
		AND tourney_hand_player_statistics.flg_t_open_opp
		AND tourney_hand_player_statistics.flg_t_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_turn_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_turn_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_river_bet() {
        this.res.write("raiser_ip_river_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND LA_P.action LIKE 'R'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2
		AND LA_P.action LIKE 'R'
		AND tourney_hand_player_statistics.flg_r_open_opp
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);
        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_river_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_river_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_bet_foldvsXR() {
        this.res.write("raiser_ip_flop_bet_foldvsXR")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_F.action LIKE 'BF'
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND (LA_F.action LIKE 'BF' or LA_F.action LIKE 'BR%' or LA_F.action LIKE 'BC')
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_bet_foldvsXR'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_bet_foldvsXR'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_bet_turn_cbet() {
        this.res.write("raiser_ip_flop_bet_turn_cbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND tourney_hand_player_statistics.flg_t_cbet 
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND tourney_hand_player_statistics.flg_f_cbet 
		AND tourney_hand_player_statistics.flg_t_cbet_opp   
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_bet_turn_cbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_bet_turn_cbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_X_turn_bet() {
        this.res.write("raiser_ip_flop_X_turn_bet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'B%' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND (LA_T.action LIKE 'B%' or LA_T.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_X_turn_bet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_X_turn_bet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_callvsXR_turn_betvsmiss() {
        this.res.write("raiser_ip_flop_callvsXR_turn_betvsmiss")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'BC' 
		AND LA_T.action LIKE 'B%' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'BC' 
		AND (LA_T.action LIKE 'B%' or LA_T.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_callvsXR_turn_betvsmiss'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_callvsXR_turn_betvsmiss'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_X_turn_foldvsbet() {
        this.res.write("raiser_ip_flop_X_turn_foldvsbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'F' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND (LA_T.action LIKE 'R%' or LA_T.action LIKE 'F' or LA_T.action LIKE 'C%')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_X_turn_foldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_X_turn_foldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flop_callvsXR_turn_foldvsbet() {
        this.res.write("raiser_ip_flop_callvsXR_turn_foldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'BC' 
		AND LA_T.action LIKE 'F' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'BC' 
		AND (LA_T.action LIKE 'R%' or LA_T.action LIKE 'F' or LA_T.action LIKE 'C%')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flop_callvsXR_turn_foldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flop_callvsXR_turn_foldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }


    async raiser_ip_flopbet_turnbet_rivercbet() {
        this.res.write("raiser_ip_flopbet_turnbet_rivercbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'B' 
		AND LA_T.action LIKE 'B' 
		AND LA_R.action LIKE 'B%' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'B' 
		AND LA_T.action LIKE 'B' 
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flopbet_turnbet_rivercbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flopbet_turnbet_rivercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flopX_turnbet_rivercbet() {
        this.res.write("raiser_ip_flopX_turnbet_rivercbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'B' 
		AND LA_R.action LIKE 'B%' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'B' 
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flopX_turnbet_rivercbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flopX_turnbet_rivercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flopX_turnX_rivercbet() {
        this.res.write("raiser_ip_flopX_turnX_rivercbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'X' 
		AND LA_R.action LIKE 'B%' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'X' 
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flopX_turnX_rivercbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flopX_turnX_rivercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flopX_turnX_riverfoldvsbet() {
        this.res.write("raiser_ip_flopX_turnX_riverfoldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'X' 
		AND LA_R.action LIKE 'F' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'X' 
		AND (LA_R.action LIKE 'R%' or LA_R.action LIKE 'F' or LA_R.action LIKE 'C%')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flopX_turnX_riverfoldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flopX_turnX_riverfoldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async raiser_ip_flopX_turncall_riverfoldvsbet() {
        this.res.write("raiser_ip_flopX_turncall_riverfoldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'C' 
		AND LA_R.action LIKE 'F' 
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE 
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE '%R' 
		AND LA_F.action LIKE 'X' 
		AND LA_T.action LIKE 'C' 
		AND (LA_R.action LIKE 'R%' or LA_R.action LIKE 'F' or LA_R.action LIKE 'C%')
		AND tourney_hand_player_statistics.flg_f_has_position 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10 
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7 
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['raiser_ip_flopX_turncall_riverfoldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['raiser_ip_flopX_turncall_riverfoldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopbet() {
        this.res.write("caller_ip_flopbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_F.action LIKE 'B%' or LA_F.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_turnbet() {
        this.res.write("caller_ip_turnbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_T.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_T.action LIKE 'B%' or LA_T.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_turnbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_turnbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_riverbet() {
        this.res.write("caller_ip_riverbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_riverbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_riverbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flop_raisevsbet() {
        this.res.write("caller_ip_flop_raisevsbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE '%R%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_F.action LIKE '%C' or LA_F.action LIKE 'R%' or LA_F.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flop_raisevsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flop_raisevsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_turn_raisevsbet() {
        this.res.write("caller_ip_turn_raisevsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_T.action LIKE '%R%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_T.action LIKE '%C' or LA_T.action LIKE 'R%' or LA_T.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_turn_raisevsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_turn_raisevsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_river_raisevsbet() {
        this.res.write("caller_ip_river_raisevsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_R.action LIKE '%R%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_R.action LIKE '%C%' or LA_R.action LIKE '%R%' or LA_R.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_player_statistics.enum_face_allin = 'N'
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_river_raisevsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_river_raisevsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flop_foldvsbet() {
        this.res.write("caller_ip_flop_foldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'F'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_F.action LIKE '%C' or LA_F.action LIKE '%R%' or LA_F.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flop_foldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flop_foldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_turn_foldvsbet() {
        this.res.write("caller_ip_turn_foldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_T.action LIKE 'F'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_T.action LIKE '%C' or LA_T.action LIKE '%R%' or LA_T.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_turn_foldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_turn_foldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_river_foldvsbet() {
        this.res.write("caller_ip_river_foldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_R.action LIKE 'F'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND (LA_R.action LIKE '%C' or LA_R.action LIKE '%R%' or LA_R.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_river_foldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_river_foldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopbet_turncbet() {
        this.res.write("caller_ip_flopbet_turncbet")
        let a = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE '%B'
		AND LA_T.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE '%B'
		AND (LA_T.action LIKE 'B%' or LA_T.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopbet_turncbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopbet_turncbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopcall_turnbetvsmiss() {
        this.res.write("caller_ip_flopcall_turnbetvsmiss")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE '%C'
		AND LA_T.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE '%C'
		AND (LA_T.action LIKE 'B%' or LA_T.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7

        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopcall_turnbetvsmiss'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopcall_turnbetvsmiss'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopX_turnbetvsmiss() {
        this.res.write("caller_ip_flopX_turnbetvsmiss")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'X'
		AND (LA_T.action LIKE 'B%' or LA_T.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7

        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopX_turnbetvsmiss'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopX_turnbetvsmiss'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopcall_turnfoldvsbet() {
        this.res.write("caller_ip_flopcall_turnfoldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND LA_T.action LIKE 'F'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND (LA_T.action LIKE 'F' or LA_T.action LIKE 'R%' or LA_T.action LIKE 'C')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopcall_turnfoldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopcall_turnfoldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopbet_turnbet_rivercbet() {
        this.res.write("caller_ip_flopbet_turnbet_rivercbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'B'
		AND LA_T.action LIKE 'B'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'B'
		AND LA_T.action LIKE 'B'
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopbet_turnbet_rivercbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopbet_turnbet_rivercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopX_turnbet_rivercbet() {
        this.res.write("caller_ip_flopX_turnbet_rivercbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'B'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'B'
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopX_turnbet_rivercbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopX_turnbet_rivercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopcall_turnbet_rivercbet() {
        this.res.write("caller_ip_flopcall_turnbet_rivercbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND LA_T.action LIKE 'B'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE '%C'
		AND LA_T.action LIKE 'B'
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopcall_turnbet_rivercbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopcall_turnbet_rivercbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopX_turnX_riverbetvsmiss() {
        this.res.write("caller_ip_flopX_turnX_riverbetvsmiss")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'X'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'X'
		AND LA_T.action LIKE 'X'
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopX_turnX_riverbetvsmiss'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopX_turnX_riverbetvsmiss'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopcall_turncall_riverbetvsmiss() {
        this.res.write("caller_ip_flopcall_turncall_riverbetvsmiss")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND LA_T.action LIKE 'C'
		AND LA_R.action LIKE 'B%'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND LA_T.action LIKE 'C'
		AND (LA_R.action LIKE 'B%' or LA_R.action LIKE 'X')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopcall_turncall_riverbetvsmiss'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopcall_turncall_riverbetvsmiss'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async caller_ip_flopcall_turncall_riverfoldvsbet() {
        this.res.write("caller_ip_flopcall_turncall_riverfoldvsbet")
        let a = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND LA_T.action LIKE 'C'
		AND LA_R.action LIKE 'F'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
		FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r 
        WHERE
		${this.check_str} 
		AND char_length(tourney_hand_summary.str_aggressors_p) = 2 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action LIKE 'C'
		AND LA_F.action LIKE 'C'
		AND LA_T.action LIKE 'C'
		AND (LA_R.action LIKE 'C' or LA_R.action LIKE 'R%' or LA_R.action LIKE 'F')
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['caller_ip_flopcall_turncall_riverfoldvsbet'] = isNaN(result) ? 0 : result;
        this.formulas['caller_ip_flopcall_turncall_riverfoldvsbet'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }




















    async _3betpot_raiseroop_cbetflop() {
        this.res.write("_3betpot_raiseroop_cbetflop");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND tourney_hand_player_statistics.flg_f_cbet
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_raiseroop_cbetflop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_raiseroop_cbetflop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_raiseroop_delaycbet_turn() {
        this.res.write("_3betpot_raiseroop_delaycbet_turn");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_t
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND LA2.action = 'X'
		AND (LA3.action = 'B' or LA3.action = 'B%')
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_t
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND LA2.action = 'X'
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_raiseroop_delaycbet_turn'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_raiseroop_delaycbet_turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_raiserip_cbet_flop() {
        this.res.write("_3betpot_raiserip_cbet_flop");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND tourney_hand_player_statistics.flg_f_cbet
		AND tourney_hand_player_statistics.flg_f_has_position
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
                `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND tourney_hand_player_statistics.flg_f_has_position
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_raiserip_cbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_raiserip_cbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_raiserip_delaycbet_turn() {
        this.res.write("_3betpot_raiserip_delaycbet_turn");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_t
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND LA2.action = 'X'
		AND tourney_hand_player_statistics.flg_t_open
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_player_statistics.flg_t_open_opp
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
                `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA1 ON LA1.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA2 ON LA2.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA3 ON LA3.id_action = tourney_hand_player_statistics.id_action_t
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2
		AND tourney_hand_player_statistics.flg_p_3bet
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND LA2.action = 'X'
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_player_statistics.flg_t_open_opp
		AND (NOT(tourney_hand_player_statistics.flg_p_squeeze) or NOT(tourney_hand_player_statistics.flg_p_squeeze_opp))
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
				AND (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
			    OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4'
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' 
				OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' 
			 	OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_raiserip_delaycbet_turn'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_raiserip_delaycbet_turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_calleroop_foldvscbet_flop() {
        this.res.write("_3betpot_calleroop_foldvscbet_flop");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND LA_F.action = 'XF'
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND (LA_F.action LIKE 'X%' and NOT(LA_F.action = 'X'))
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_calleroop_foldvscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_calleroop_foldvscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_calleroop_raisevscbet_flop() {
        this.res.write("_3betpot_calleroop_raisevscbet_flop");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND LA_F.action LIKE 'XR%'
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND (LA_F.action LIKE 'X%' and NOT(LA_F.action = 'X'))
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;

        this.data['_3betpot_calleroop_raisevscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_calleroop_raisevscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_calleroop_probe_river() {
        this.res.write("_3betpot_calleroop_probe_river");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND (LA_F.action LIKE 'XC' and NOT(LA_F.action = 'X'))
		AND LA_T.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_r_bet 
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
		INNER JOIN lookup_actions AS LA_R ON LA_R.id_action = tourney_hand_player_statistics.id_action_r
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND (LA_F.action LIKE 'XC' and NOT(LA_F.action = 'X'))
		AND LA_T.action LIKE 'X'
		AND tourney_hand_player_statistics.flg_r_open_opp
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND NOT(tourney_hand_player_statistics.flg_f_has_position)
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_calleroop_probe_river'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_calleroop_probe_river'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_callerip_foldvscbet_flop() {
        this.res.write("_3betpot_callerip_foldvscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND LA_F.action = 'F'
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND NOT(LA_F.action = 'X')
		AND NOT(LA_F.action = '')
		AND NOT(LA_F.action = 'B')
		AND NOT(LA_F.action = 'RC')
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_callerip_foldvscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_callerip_foldvscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_callerip_raisevscbet_flop() {
        this.res.write("_3betpot_callerip_raisevscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND LA_F.action LIKE 'R%'
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND NOT(LA_F.action = 'X')
		AND NOT(LA_F.action = '')
		AND NOT(LA_F.action = 'B')
		AND NOT(LA_F.action = 'RC')
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_callerip_raisevscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_callerip_raisevscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _3betpot_callerip_betvsmisscbet_flop() {
        this.res.write("_3betpot_callerip_betvsmisscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND LA_F.action LIKE 'B%'
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_player_statistics.enum_p_squeeze_action = 'N'
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		WHERE ${this.check_str}
		AND char_length(tourney_hand_summary.str_aggressors_p) = 3 
		AND tourney_hand_summary.cnt_players_f = 2 
		AND LA_P.action = 'RC'
		AND tourney_hand_player_statistics.flg_f_open_opp
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
		AND tourney_hand_player_statistics.cnt_p_face_limpers = 0
		AND tourney_hand_player_statistics.flg_f_has_position
		AND tourney_hand_player_statistics.enum_p_squeeze_action = 'N'
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position BETWEEN 0 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_3betpot_callerip_betvsmisscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_3betpot_callerip_betvsmisscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sbraiser_cbet_flop() {
        this.res.write("_bvb_sbraiser_cbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'R'
		AND LA_F.action LIKE 'B%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'R'
		AND tourney_hand_player_statistics.flg_f_open_opp
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sbraiser_cbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sbraiser_cbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sbraiser_XR_flop() {
        this.res.write("_bvb_sbraiser_XR_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'R'
		AND LA_F.action LIKE 'XR%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'R'
		AND (LA_F.action LIKE 'X%' and NOT(LA_F.action = 'X'))
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sbraiser_XR_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sbraiser_XR_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sbraiser_cbet_turn() {
        this.res.write("_bvb_sbraiser_cbet_turn");
        let a = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t 
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'R'
		AND LA_F.action LIKE 'B%'
		AND LA_T.action LIKE 'B%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p 
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f 
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'R'
		AND LA_F.action LIKE 'B'
		AND tourney_hand_player_statistics.flg_t_open_opp
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sbraiser_cbet_turn'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sbraiser_cbet_turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sbraiser_delay_cbet_turn() {
        this.res.write("_bvb_sbraiser_delay_cbet_turn");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		WHERE ${this.check_str}
		AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_F.action = 'X'
		AND (LA_T.action LIKE 'B%')
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position = 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		WHERE ${this.check_str}
		AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_F.action = 'X'
		AND tourney_hand_player_statistics.flg_f_cbet_opp
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
		AND tourney_hand_player_statistics.position = 9
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sbraiser_delay_cbet_turn'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sbraiser_delay_cbet_turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sblimper_bet_flop() {
        this.res.write("_bvb_sblimper_bet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.flg_f_bet
		AND lookup_actions.action = 'C'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND lookup_actions.action = 'C'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sblimper_bet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sblimper_bet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sblimper_XR_flop() {
        this.res.write("_bvb_sblimper_XR_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XR%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X%'
		AND char_length(LA_F.action) > 1 
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sblimper_XR_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sblimper_XR_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sblimper_XF_flop() {
        this.res.write("_bvb_sblimper_XF_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'XF%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND LA_P.action = 'C'
		AND LA_F.action LIKE 'X%'
		AND char_length(LA_F.action) > 1 
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sblimper_XF_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sblimper_XF_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_sblimper_cbet_turn() {
        this.res.write("_bvb_sblimper_cbet_turn");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.flg_f_bet
		AND tourney_hand_player_statistics.flg_t_bet
		AND LA_P.action = 'C'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.flg_f_bet
		AND LA_P.action = 'C'
		AND LA_F.action = 'B'
		AND tourney_hand_player_statistics.flg_t_open_opp
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_sblimper_cbet_turn'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_sblimper_cbet_turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbcaller_raisevscbet_flop() {
        this.res.write("_bvb_bbcaller_raisevscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'C'
		and LA_F.action LIKE 'R%'
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'C'
		and NOT(tourney_hand_player_statistics.flg_f_open_opp)
		AND char_length(LA_F.action) > 0 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbcaller_raisevscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbcaller_raisevscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbcaller_foldvscbet_flop() {
        this.res.write("_bvb_bbcaller_foldvscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'C'
		and LA_F.action LIKE 'F'
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'C'
		and NOT(tourney_hand_player_statistics.flg_f_open_opp)
		AND char_length(LA_F.action) > 0 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbcaller_foldvscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbcaller_foldvscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbcaller_foldvscbet_turn() {
        this.res.write("_bvb_bbcaller_foldvscbet_turn");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'C'
		and LA_F.action LIKE 'C'
		and LA_T.action LIKE 'F'
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN lookup_actions AS LA_T ON LA_T.id_action = tourney_hand_player_statistics.id_action_t
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'C'
		and LA_F.action LIKE 'C'
		and NOT(LA_T.action = 'X')
		and NOT(LA_T.action LIKE 'B%')
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbcaller_foldvscbet_turn'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbcaller_foldvscbet_turn'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbchecker_foldvscbet_flop() {
        this.res.write("_bvb_bbchecker_foldvscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'X'
		and LA_F.action = 'F'
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'X'
		and NOT(LA_F.action = 'X')
		and NOT(LA_F.action LIKE 'B%')
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbchecker_foldvscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbchecker_foldvscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbchecker_raisevscbet_flop() {
        this.res.write("_bvb_bbchecker_raisevscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'X'
		and LA_F.action LIKE 'R%'
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'X'
		and NOT(LA_F.action = 'X')
		and NOT(LA_F.action LIKE 'B%')
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbchecker_raisevscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbchecker_raisevscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbchecker_betvsmisscbet_flop() {
        this.res.write("_bvb_bbchecker_betvsmisscbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'X'
		and LA_F.action LIKE 'B%'
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and LA_P.action = 'X'
		and tourney_hand_player_statistics.flg_f_open_opp 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbchecker_betvsmisscbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbchecker_betvsmisscbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async _bvb_bbafteriso_cbet_flop() {
        this.res.write("_bvb_bbafteriso_cbet_flop");
        let a = await this.DB.query(`
		SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and tourney_hand_player_statistics.cnt_p_face_limpers = 1
		and LA_P.action = 'R'
		and tourney_hand_player_statistics.flg_f_cbet
		and tourney_hand_player_statistics.flg_f_open_opp 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT COUNT(*)
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions AS LA_P ON LA_P.id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN lookup_actions AS LA_F ON LA_F.id_action = tourney_hand_player_statistics.id_action_f
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and tourney_hand_player_statistics.cnt_p_face_limpers = 1
		and LA_P.action = 'R'
		and tourney_hand_player_statistics.flg_f_open_opp 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['_bvb_bbafteriso_cbet_flop'] = isNaN(result) ? 0 : result;
        this.formulas['_bvb_bbafteriso_cbet_flop'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_ep_vs_open_2_4_bb_less28bb_EV() {
        this.res.write("vpip_ep_vs_open_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_ep_vs_open_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_ep_vs_open_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_ep_2_4_bb_less28bb_EV() {
        this.res.write("vpip_mp_vs_ep_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_ep_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_ep_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_mp_2_4_bb_less28bb_EV() {
        this.res.write("vpip_mp_vs_mp_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_mp_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_mp_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_ep_2_4_bb_less28bb_EV() {
        this.res.write("vpip_co_vs_ep_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_ep_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_ep_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_mp_2_4_bb_less28bb_EV() {
        this.res.write("vpip_co_vs_mp_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_mp_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_mp_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_ep_2_4_bb_less28bb_EV() {
        this.res.write("vpip_bu_vs_ep_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_ep_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_ep_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_mp_2_4_bb_less28bb_EV() {
        this.res.write("vpip_bu_vs_mp_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_mp_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_mp_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_co_2_4_bb_less28bb_EV() {
        this.res.write("vpip_bu_vs_co_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'	
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_co_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_co_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_ep_2_4_bb_less28bb_EV() {
        this.res.write("vpip_sb_vs_ep_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_ep_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_ep_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_mp_2_4_bb_less28bb_EV() {
        this.res.write("vpip_sb_vs_mp_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_mp_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_mp_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_co_2_4_bb_less28bb_EV() {
        this.res.write("vpip_sb_vs_co_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_co_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_co_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_bu_2_4_bb_less28bb_EV() {
        this.res.write("vpip_sb_vs_bu_2_4_bb_less28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb <= 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_bu_2_4_bb_less28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_bu_2_4_bb_less28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_ep_vs_open_2_4_bb_great28bb_EV() {
        this.res.write("vpip_ep_vs_open_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 5 and 7
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_ep_vs_open_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_ep_vs_open_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_ep_2_4_bb_great28bb_EV() {
        this.res.write("vpip_mp_vs_ep_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_ep_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_ep_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_mp_vs_mp_2_4_bb_great28bb_EV() {
        this.res.write("vpip_mp_vs_mp_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position BETWEEN 2 and 4
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_mp_vs_mp_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_mp_vs_mp_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_ep_2_4_bb_great28bb_EV() {
        this.res.write("vpip_co_vs_ep_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_ep_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_ep_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_co_vs_mp_2_4_bb_great28bb_EV() {
        this.res.write("vpip_co_vs_mp_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 1
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_co_vs_mp_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_co_vs_mp_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_ep_2_4_bb_great28bb_EV() {
        this.res.write("vpip_bu_vs_ep_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_ep_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_ep_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_mp_2_4_bb_great28bb_EV() {
        this.res.write("vpip_bu_vs_mp_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
				and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_mp_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_mp_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_bu_vs_co_2_4_bb_great28bb_EV() {
        this.res.write("vpip_bu_vs_co_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'	
		AND tourney_hand_player_statistics.position = 0
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 0
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_bu_vs_co_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_bu_vs_co_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_ep_2_4_bb_great28bb_EV() {
        this.res.write("vpip_sb_vs_ep_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_ep_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_ep_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_mp_2_4_bb_great28bb_EV() {
        this.res.write("vpip_sb_vs_mp_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_mp_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_mp_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_co_2_4_bb_great28bb_EV() {
        this.res.write("vpip_sb_vs_co_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_co_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_co_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async vpip_sb_vs_bu_2_4_bb_great28bb_EV() {
        this.res.write("vpip_sb_vs_bu_2_4_bb_great28bb_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND (lookup_actions.action LIKE 'C%' or lookup_actions.action LIKE 'R%')
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
        AND tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 4
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_effective_stack / tourney_blinds.amt_bb > 28 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb >= 2 
		and (tourney_hand_player_statistics.amt_p_2bet_facing + tourney_hand_player_statistics.amt_blind) / tourney_blinds.amt_bb <= 2.4
		and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 9
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['vpip_sb_vs_bu_2_4_bb_great28bb_EV'] = isNaN(result) ? 0 : result;
        this.formulas['vpip_sb_vs_bu_2_4_bb_great28bb_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_ep_EV() {
        this.res.write("foldvs1R_2_4_bb_vs_ep_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '5' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '6' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '7')
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_ep_EV'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_ep_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_mp_EV() {
        this.res.write("foldvs1R_2_4_bb_vs_mp_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and (substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '2' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '3' OR substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '4')
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_mp_EV'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_mp_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_co_EV() {
        this.res.write("foldvs1R_2_4_bb_vs_co_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '1'
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_co_EV'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_co_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async foldvs1R_2_4_bb_vs_bu_EV() {
        this.res.write("foldvs1R_2_4_bb_vs_bu_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 8
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_aggressors_p from 2 for 1) = '0'
		AND tourney_hand_player_statistics.position = 8
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['foldvs1R_2_4_bb_vs_bu_EV'] = isNaN(result) ? 0 : result;
        this.formulas['foldvs1R_2_4_bb_vs_bu_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_raise_EV() {
        this.res.write("bvb_sb_raise_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND lookup_actions.action LIKE 'R%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_raise_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_raise_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_limp_EV() {
        this.res.write("bvb_sb_limp_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND lookup_actions.action LIKE 'C%'
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_open_opp 
		AND tourney_hand_player_statistics.position = 9
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_limp_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_limp_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_limp_fold_EV() {
        this.res.write("bvb_sb_limp_fold_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND lookup_actions.action = 'CF'
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_player_statistics.flg_p_face_raise
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_limp_fold_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_limp_fold_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_sb_limp_raise_EV() {
        this.res.write("bvb_sb_limp_raise_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND lookup_actions.action = 'CR'
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.flg_p_limp 
		AND tourney_hand_player_statistics.flg_p_open_opp
		AND tourney_hand_player_statistics.flg_p_face_raise
		AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_sb_limp_raise_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_sb_limp_raise_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_iso_EV() {
        this.res.write("bvb_bb_iso_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and tourney_hand_player_statistics.cnt_p_face_limpers = 1 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		and lookup_actions.action Like 'R%'
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player
		INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
        ${this.check_str}
        AND tourney_hand_player_statistics.position = 8 
		and tourney_hand_player_statistics.cnt_p_face_limpers = 1 
		and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_iso_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_iso_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_fold_vs_raise_less2_4_EV() {
        this.res.write("bvb_bb_fold_vs_raise_less2_4_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.4
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_fold_vs_raise_less2_4_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_fold_vs_raise_less2_4_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_fold_vs_raise_less2_8_EV() {
        this.res.write("bvb_bb_fold_vs_raise_less2_8_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
        and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.4
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.8
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.4
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 1.8
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_fold_vs_raise_less2_8_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_fold_vs_raise_less2_8_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

    async bvb_bb_fold_vs_raise_less3_7_EV() {
        this.res.write("bvb_bb_fold_vs_raise_less3_7_EV")
        let a = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND lookup_actions.action LIKE 'F%'
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
        and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2.7
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let b = await this.DB.query(`
        SELECT SUM(tourney_hand_player_statistics.amt_expected_won / tourney_blinds.amt_bb)::float/(COUNT(*))*100
        FROM tourney_hand_player_statistics 
        INNER JOIN player ON tourney_hand_player_statistics.id_player = player.id_player 
        INNER JOIN lookup_actions ON id_action = tourney_hand_player_statistics.id_action_p
        INNER JOIN tourney_blinds ON tourney_blinds.id_blinds = tourney_hand_player_statistics.id_blinds
		INNER JOIN tourney_hand_summary ON tourney_hand_summary.id_hand = tourney_hand_player_statistics.id_hand
        WHERE
		${this.check_str}
		AND NOT(tourney_hand_player_statistics.flg_p_limp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing > 0
		AND NOT(tourney_hand_player_statistics.flg_p_squeeze_opp)
        AND tourney_hand_player_statistics.amt_p_2bet_facing < tourney_hand_player_statistics.amt_p_effective_stack * 0.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb >= 1.8
		and tourney_hand_player_statistics.amt_p_2bet_facing / tourney_blinds.amt_bb <= 2.7
        and substring(tourney_hand_summary.str_actors_p from 1 for 1) = '9' 
		AND tourney_hand_player_statistics.position = 8
		AND tourney_hand_summary.cnt_players BETWEEN 3 and 10
        `);

        let result = (a.rows[0].count / b.rows[0].count) * 100;
        this.data['bvb_bb_fold_vs_raise_less3_7_EV'] = isNaN(result) ? 0 : result;
        this.formulas['bvb_bb_fold_vs_raise_less3_7_EV'] = `${a.rows[0].count} / ${b.rows[0].count}`;
    }

}

module.exports = Stats