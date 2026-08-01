create index if not exists lineup_players_owner_idx on public.lineup_players(owner_id);
create index if not exists lineup_players_player_idx on public.lineup_players(player_id);
create index if not exists lineups_owner_idx on public.lineups(owner_id);
create index if not exists lineups_tactic_idx on public.lineups(tactic_id);

create index if not exists match_commands_owner_idx on public.match_commands(owner_id);
create index if not exists match_events_owner_idx on public.match_events(owner_id);
create index if not exists match_events_player_idx on public.match_events(player_id) where player_id is not null;
create index if not exists match_events_secondary_player_idx on public.match_events(secondary_player_id) where secondary_player_id is not null;
create index if not exists match_injuries_match_idx on public.match_injuries(match_id);
create index if not exists match_injuries_owner_idx on public.match_injuries(owner_id);
create index if not exists match_injuries_player_idx on public.match_injuries(player_id) where player_id is not null;
create index if not exists match_player_stats_owner_idx on public.match_player_stats(owner_id);
create index if not exists match_player_stats_player_idx on public.match_player_stats(player_id) where player_id is not null;
create index if not exists match_reports_owner_idx on public.match_reports(owner_id);
create index if not exists match_states_owner_idx on public.match_states(owner_id);
create index if not exists match_substitutions_match_idx on public.match_substitutions(match_id);
create index if not exists match_substitutions_owner_idx on public.match_substitutions(owner_id);
create index if not exists match_substitutions_player_out_idx on public.match_substitutions(player_out_id) where player_out_id is not null;
create index if not exists match_substitutions_player_in_idx on public.match_substitutions(player_in_id) where player_in_id is not null;
create index if not exists match_team_stats_owner_idx on public.match_team_stats(owner_id);

create index if not exists matches_club_schedule_idx on public.matches(club_id, scheduled_at desc);
create index if not exists matches_competition_status_minute_idx on public.matches(competition, status, current_minute);
create index if not exists matches_home_club_idx on public.matches(home_club_id) where home_club_id is not null;
create index if not exists matches_away_club_idx on public.matches(away_club_id) where away_club_id is not null;
create index if not exists matches_home_tactic_idx on public.matches(home_tactic_id) where home_tactic_id is not null;
create index if not exists matches_away_tactic_idx on public.matches(away_tactic_id) where away_tactic_id is not null;
create index if not exists matches_home_lineup_idx on public.matches(home_lineup_id) where home_lineup_id is not null;
create index if not exists matches_away_lineup_idx on public.matches(away_lineup_id) where away_lineup_id is not null;

create index if not exists player_promises_player_idx on public.player_promises(player_id, status, deadline);
create index if not exists player_promises_meeting_idx on public.player_promises(meeting_id) where meeting_id is not null;
create index if not exists player_tactic_familiarity_owner_idx on public.player_tactic_familiarity(owner_id);
create index if not exists player_tactic_familiarity_tactic_idx on public.player_tactic_familiarity(tactic_id);
create index if not exists tactics_owner_idx on public.tactics(owner_id);
