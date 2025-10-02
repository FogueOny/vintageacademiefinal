-- Storage bucket and policies for Exam Blanc oral responses

-- Créer bucket pour audios Expression Orale
insert into storage.buckets (id, name, public)
values ('exam-oral-responses', 'exam-oral-responses', false)
on conflict (id) do nothing;

-- Politique: utilisateurs peuvent uploader leurs propres audios
drop policy if exists "Users can upload their oral responses" on storage.objects;
create policy "Users can upload their oral responses"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'exam-oral-responses'
);

-- Politique: tous les utilisateurs authentifiés peuvent lire les audios du bucket
drop policy if exists "Admins can read all oral responses" on storage.objects;
drop policy if exists "Users can read their own oral responses" on storage.objects;
create policy "Authenticated users can read oral responses"
on storage.objects for select
to authenticated
using (
  bucket_id = 'exam-oral-responses'
);

-- Politique: users peuvent supprimer leurs propres audios (avant correction)
create policy "Users can delete their own uncorrected oral responses"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'exam-oral-responses'
  and (storage.foldername(name))[1] = auth.uid()::text
);
