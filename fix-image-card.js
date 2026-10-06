const fs = require('fs');

let html = fs.readFileSync('code.html', 'utf8');

// Encontrar a seção completa do Image Card e reescrevê-la de forma limpa
// Localiza do inicio da section até o fechamento dela
const startMarker = '    <!-- Image Card Section -->';
const endMarker = '    <!-- About Us Section -->';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Marcadores não encontrados!');
  process.exit(1);
}

const cleanImageCardSection = `    <!-- Image Card Section -->
    <section style="width: 100%; max-width: 1280px; margin: 0 auto; box-sizing: border-box; padding: 2rem 24px 4rem 24px;">
      <div class="relative w-full overflow-hidden" style="border-radius: 3rem; height: 80vh; min-height: 580px; background: #062D44;">

        <!-- Background image with parallax (wrapper clips overflow from rounded parent) -->
        <div id="imgcard-parallax-wrap">
          <img
            id="parallax-imgcard-bg"
            src="Psychologist_and_patient_talking_202608131705.jpeg"
            alt="Atendimento psicológico - Instituto Contextualize" />
        </div>

        <!-- Radial Dark Gradient Overlay for perfect text legibility -->
        <div
          style="position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(6,45,68,0.72) 0%, rgba(6,45,68,0.85) 100%); z-index: 5;">
        </div>

        <!-- ── CENTERED CONTENT: Hero-style White Headline, Subtitle, CTA Buttons ── -->
        <div style="
          position: relative;
          z-index: 20;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 2rem;
          max-width: 900px;
          margin: 0 auto;
          box-sizing: border-box;
        ">
          <!-- Headline in White (Hero pattern: Montserrat bold + Georgia italic) -->
          <div style="margin-bottom: 1.5rem; text-align: center;" class="reveal">
            <p id="image-card-headline-line1" style="
              font-family: Montserrat, sans-serif;
              font-size: clamp(2.2rem, 3.8vw, 4.4rem);
              font-weight: 800;
              line-height: 1.05;
              letter-spacing: -0.02em;
              color: #ffffff;
              margin: 0;
            ">
              Qual contexto
            </p>
            <p id="image-card-headline-line2" style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: clamp(2.4rem, 4.2vw, 4.8rem);
              font-style: italic;
              font-weight: 400;
              letter-spacing: 0.01em;
              color: #ffffff;
              margin: -0.12em 0 0 0;
              line-height: 1;
              white-space: nowrap;
            ">
              te trouxe até aqui?
            </p>
          </div>

          <!-- Subtitle in White -->
          <p id="image-card-subtitle" class="reveal reveal-delay-2" style="
            font-family: Manrope, sans-serif;
            font-size: clamp(1.05rem, 1.4vw, 1.25rem);
            font-weight: 400;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.92);
            margin: 0 auto 2.25rem auto;
            max-width: 640px;
          ">
            Atendimento clínico para quem precisa de cuidado. Formação para quem quer cuidar melhor.
          </p>

          <!-- Buttons: Centered Side by Side Pill Buttons -->
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: center;" class="reveal reveal-delay-3">
            <!-- Button 1: Agendar atendimento -->
            <a href="#agendar" style="
              display: inline-flex; align-items: center; gap: 0.65rem;
              background: #062D44; color: #ffffff;
              padding: 0.4rem 1.4rem 0.4rem 0.4rem; border-radius: 9999px;
              font-family: Manrope, sans-serif; font-size: 0.875rem; font-weight: 600;
              text-decoration: none; transition: background 0.2s, transform 0.2s;
              box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            " onmouseover="this.style.background='#041e2e'; this.style.transform='translateY(-1px)'"
              onmouseout="this.style.background='#062D44'; this.style.transform='translateY(0)'">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 255, 255, 0.2);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
              <span>Agendar atendimento</span>
            </a>

            <!-- Button 2: Ver formações -->
            <a href="#formations" style="
              display: inline-flex; align-items: center; gap: 0.65rem;
              background: #B5985E; color: #ffffff;
              padding: 0.4rem 1.4rem 0.4rem 0.4rem; border-radius: 9999px;
              font-family: Manrope, sans-serif; font-size: 0.875rem; font-weight: 600;
              text-decoration: none; transition: background 0.2s, transform 0.2s;
              box-shadow: 0 4px 16px rgba(181,152,94,0.3);
            " onmouseover="this.style.background='#a38750'; this.style.transform='translateY(-1px)'"
              onmouseout="this.style.background='#B5985E'; this.style.transform='translateY(0)'">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 255, 255, 0.22);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
              <span>Ver formações</span>
            </a>
          </div>
        </div>

        <!-- ── BOTTOM RIGHT: Faux-cutout corner widget ── -->
        <div style="position: absolute; bottom: 0; right: 0; width: min(340px, 28vw); height: 80px; background: #f9f9ff; border-top-left-radius: 3.5rem; z-index: 30;">
          <!-- Máscara superior-direita: corrige o encontro entre a curva e a borda direita -->
          <div style="position: absolute; top: -56px; right: 0; width: 56px; height: 56px; pointer-events: none; overflow: hidden;">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%;">
              <path d="M56 56V0C56 30.9 30.9 56 0 56H56Z" fill="#f9f9ff" />
            </svg>
          </div>
          <!-- Máscara inferior-esquerda: corrige o encontro entre a curva e a borda inferior -->
          <div style="position: absolute; bottom: 0; left: -56px; width: 56px; height: 56px; pointer-events: none; overflow: hidden;">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%;">
              <path d="M56 56H0C30.9 56 56 30.9 56 0V56Z" fill="#f9f9ff" />
            </svg>
          </div>
        </div>

      </div>
    </section>

    `;

html = html.slice(0, startIdx) + cleanImageCardSection + html.slice(endIdx);

fs.writeFileSync('code.html', html, 'utf8');
console.log('code.html corrigido com sucesso!');
console.log('Tamanho: ' + html.length + ' bytes');
