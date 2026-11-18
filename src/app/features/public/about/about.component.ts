import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  readonly values = [
    {
      icon: '◈',
      title: 'Travel, made connected',
      text: 'Stay, dine, move and explore from one thoughtful travel experience instead of a stack of disconnected tabs.',
    },
    {
      icon: '⌖',
      title: 'Bangladesh at heart',
      text: 'We build around local discovery, partner businesses and transparent pricing in Bangladeshi Taka (৳).',
    },
    {
      icon: '✦',
      title: 'Confidence in every detail',
      text: 'Clear booking steps, useful trip information and human support help travellers make decisions with ease.',
    },
  ];

  readonly ecosystem = [
    { number: '01', title: 'Stays', text: 'Find the right room, compare amenities and plan a more comfortable arrival.' },
    { number: '02', title: 'Dining', text: 'Reserve tables and discover memorable local flavours close to your route.' },
    { number: '03', title: 'Experiences', text: 'Browse packages, trusted guides and flexible ideas for every kind of journey.' },
    { number: '04', title: 'Getting there', text: 'Explore transport options that fit the pace, budget and shape of your trip.' },
  ];
}
