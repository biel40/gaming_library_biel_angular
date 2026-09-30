-- Garantiza como mucho un objetivo de platino por usuario.
-- El frontend ya desmarca el anterior antes de marcar el nuevo, así que funciona con o sin esta migración.

with ranked as (
  select user_id,
         game_id,
         row_number() over (partition by user_id order by game_id) as position
  from public.user_game_library
  where platinum_target
)
update public.user_game_library ugl
set platinum_target = false
from ranked
where ugl.user_id = ranked.user_id
  and ugl.game_id = ranked.game_id
  and ranked.position > 1;

create unique index if not exists user_game_library_single_platinum_target_idx
  on public.user_game_library (user_id)
  where platinum_target;
