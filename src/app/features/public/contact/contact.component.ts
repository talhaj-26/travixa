import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private readonly toast = inject(ToastService);
  readonly topics = ['Booking help', 'Payment or refund', 'Partner with Travixa', 'A suggestion for Travixa', 'Something else'];
  form: ContactForm = this.emptyForm();
  submitted = false;
  isSubmitting = false;

  submit(): void {
    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.topic || !this.form.message.trim()) {
      this.toast.error('A few details are missing', 'Please complete your name, email, topic and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) {
      this.toast.error('Please check your email', 'Enter a valid email address so our team can reply.');
      return;
    }
    this.isSubmitting = true;
    try {
      const key = 'travixa-contact-inquiries';
      const previous = JSON.parse(localStorage.getItem(key) ?? '[]');
      const inquiries = Array.isArray(previous) ? previous : [];
      inquiries.push({ id: crypto.randomUUID?.() ?? `inquiry-${Date.now()}`, ...this.form, submittedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(inquiries));
      this.submitted = true;
      this.toast.success('Message prepared', 'Thanks — a Travixa support teammate will be able to follow up soon.');
    } catch {
      this.toast.error('Could not save the message', 'Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  startAnotherMessage(): void { this.form = this.emptyForm(); this.submitted = false; }
  private emptyForm(): ContactForm { return { name: '', email: '', phone: '', topic: '', message: '' }; }
}
