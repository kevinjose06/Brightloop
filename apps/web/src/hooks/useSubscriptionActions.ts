import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

function extractErrorMessage(err: any): string {
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function useSubscriptionActions(subscriptionId: string) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['portal'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  };

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/portal/subscriptions/${subscriptionId}/pause`);
      return res.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Subscription paused' });
      invalidate();
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: extractErrorMessage(err) });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/portal/subscriptions/${subscriptionId}/resume`);
      return res.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Subscription resumed' });
      invalidate();
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: extractErrorMessage(err) });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/portal/subscriptions/${subscriptionId}/renew`);
      return res.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Subscription renewed' });
      invalidate();
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: extractErrorMessage(err) });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/portal/subscriptions/${subscriptionId}/close`);
      return res.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Subscription closed' });
      invalidate();
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: extractErrorMessage(err) });
    },
  });

  const isAnyPending =
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    renewMutation.isPending ||
    closeMutation.isPending;

  const clearFeedback = () => setFeedback(null);

  return {
    pause: pauseMutation.mutate,
    resume: resumeMutation.mutate,
    renew: renewMutation.mutate,
    close: closeMutation.mutate,
    pauseMutation,
    resumeMutation,
    renewMutation,
    closeMutation,
    isAnyPending,
    feedback,
    clearFeedback,
  };
}
