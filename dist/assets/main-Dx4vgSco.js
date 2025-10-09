window.toggleMenu=function(){const e=document.getElementById("navLinks");e&&e.classList.toggle("active")};window.handleSubmit=function(e){e.preventDefault();const t=e.target,n=t.closest(".community-box");console.log("Subscription form submitted. Data:",new FormData(t)),n?n.innerHTML=`
            <div style="text-align: center; padding: 2rem;">
                <h3 style="color: #6366f1; font-size: 1.5rem; margin-bottom: 0.5rem;">🎉 You're Subscribed!</h3>
                <p>Check your email to confirm your subscription and start receiving exclusive privacy tips.</p>
            </div>
        `:(console.log("Thank you for subscribing! Success message element not found, but submission simulated."),t.reset())};document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(t){t.preventDefault();const n=document.querySelector(this.getAttribute("href"));if(n){n.scrollIntoView({behavior:"smooth"});const o=document.getElementById("navLinks");o&&o.classList.remove("active")}})})});
