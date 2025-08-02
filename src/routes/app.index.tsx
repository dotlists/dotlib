import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import React, { useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AppContext } from './app';

export const Route = createFileRoute('/app/')({
  component: AppIndex,
});

function AppIndex() {
  const rawLists = useQuery(api.lists.getLists);
  const navigate = useNavigate();
  const { handleCreateList } = useContext(AppContext);

  useEffect(() => {
    if (rawLists && rawLists.length > 0) {
      navigate({
        to: '/app/list/$listId',
        params: { listId: rawLists[0]._id },
        replace: true,
      });
    }
  }, [rawLists, navigate]);

  if (rawLists && rawLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen -mt-16">
        <h1 className="text-4xl font-bold mb-8">no lists yet!</h1>
        <Button onClick={() => handleCreateList()}>create a new list</Button>
      </div>
    );
  }

  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}
