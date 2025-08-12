import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject, first, filter, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private client: Client;
  private connectionState$ = new BehaviorSubject<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/api/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('STOMP: Connected');
        this.connectionState$.next('CONNECTED');
      },
      onDisconnect: () => {
        console.log('STOMP: Disconnected');
        this.connectionState$.next('DISCONNECTED');
      },
      onStompError: (frame) => {
        console.error('STOMP: Broker reported error: ' + frame.headers['message']);
        console.error('STOMP: Additional details: ' + frame.body);
      },
    });
  }

  public connect(): void {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  public disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  public onConnect(): Observable<boolean> {
    return this.connectionState$.pipe(
      filter(state => state === 'CONNECTED'),
      switchMap(() => new BehaviorSubject<boolean>(true))
    );
  }

  public subscribe(topic: string): Observable<IMessage> {
    return this.connectionState$.pipe(
      filter(state => state === 'CONNECTED'),
      first(),
      switchMap(() => {
        return new Observable<IMessage>(observer => {
          console.log(`STOMP: Subscribing to ${topic}`);
          const subscription: StompSubscription = this.client.subscribe(topic, message => {
            observer.next(message);
          });
          return () => {
            console.log(`STOMP: Unsubscribing from ${topic}`);
            subscription.unsubscribe();
          };
        });
      })
    );
  }
}
