-- Storage bucket and policies for Exam Blanc oral responses

-- Créer bucket pour audios Expression Orale
insert into storage.buckets (id, name, public)
values ('exam-oral-responses', 'exam-oral-responses', false)
on conflict (id) do nothing;

-- Politique: utilisateurs peuvent uploader leurs propres audios
create policy "Users can upload their oral responses"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'exam-oral-responses' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: admins peuvent lire tous les audios
create policy "Admins can read all oral responses"
on storage.objects for select
to authenticated
using (
  bucket_id = 'exam-oral-responses'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Politique: users peuvent lire leurs propres audios
create policy "Users can read their own oral responses"
on storage.objects for select
to authenticated
using (
  bucket_id = 'exam-oral-responses'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: users peuvent supprimer leurs propres audios (avant correction)
create policy "Users can delete their own uncorrected oral responses"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'exam-oral-responses'
  and (storage.foldername(name))[1] = auth.uid()::text
);
