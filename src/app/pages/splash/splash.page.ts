import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule],
})
export class SplashPage implements OnInit {
  @ViewChild('contentBox', { static: true }) contentBoxRef!: ElementRef;

  private isAnimating = false;
  private splashTimeout: any;
  private animationTimeout: any;
  private readonly totalDuration = 5000;
  private readonly animationDuration = 3000;
  private animationStartTime: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.startSplashTimer();
  }

  @HostListener('click')
  onScreenTap() {
    if (!this.isAnimating) {
      this.playAnimation();
    }
  }

  private startSplashTimer() {
    clearTimeout(this.splashTimeout);
    const elapsed = this.isAnimating ? Date.now() - this.animationStartTime : 0;
    const remaining = this.totalDuration - elapsed;

    this.splashTimeout = setTimeout(() => {
      this.navigateToHome();
    }, remaining);
  }

  private playAnimation() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animationStartTime = Date.now();

    const contentBox = this.contentBoxRef.nativeElement;
    contentBox.classList.add('animate-out');
    contentBox.style.setProperty(
      '--animation-duration',
      `${this.animationDuration}ms`
    );

    this.animationTimeout = setTimeout(() => {
      contentBox.classList.remove('animate-out');
      contentBox.classList.add('reset-animation');

      setTimeout(() => {
        contentBox.classList.remove('reset-animation');
        this.isAnimating = false;
      }, 1800);
    }, this.animationDuration);

    this.startSplashTimer();
  }

  private navigateToHome() {
    clearTimeout(this.splashTimeout);
    clearTimeout(this.animationTimeout);
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.navigateToHome();
  }
}
