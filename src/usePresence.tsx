import { useState, useEffect, useRef, useCallback } from 'react';
import { PresenceClient } from '@roomservice/browser';
import { useRoom } from './useRoom';
import { useLocalPubSub, useSelf } from './contextForSubscriptions';

export function usePresence<T extends any>(
  roomName: string,
  key: string
): [{ [key: string]: T }, (value: T) => any] {
  const presence = useRef<PresenceClient>();
  const [val, setVal] = useState<{ [key: string]: T }>({});
  const room = useRoom(roomName);
  const self = useSelf();
  const local = useLocalPubSub();
  const localKey = 'p' + roomName + key;

  useEffect(() => {
    if (!room) return;

    const p = room!.presence();
    presence.current = p;

    p.getAll<T>(key).then(val => {
      setVal(val);
    });

    room!.subscribe<T>(p, key, val => {
      setVal(val);
    });

    local.subscribe(self, localKey, val => {
      setVal(val);
    });
  }, [room, key]);

  //TODO: batch calls to this function before presence is ready
  const set = useCallback((value: T) => {
    if (!presence.current) return;
    presence.current?.set(key, value);
    local.publish(self, localKey, value);
  }, []);

  return [val, set];
}
