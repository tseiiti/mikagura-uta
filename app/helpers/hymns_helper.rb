module HymnsHelper
  def hymn_html(hymn, &block)
    paragraphs = hymn[:paragraphs]
    @first = true

    html = tag.h1 hymn[:title]
    paragraphs.each_with_index do |paragraph, i|
      html += paragraph(paragraph, i, hymn[:size])
    end
    html += fixed_bottom(hymn[:title])
    html.html_safe
  end

  def fixed_bottom(title)
    tag.div class: "fixed-bottom" do
      tag.div class: "position-absolute bottom-0 end-0 m-2 text-secondary", style: "font-size: 24px;" do
        html = tag.span class: "text-capitalize", style: "margin-right: 8px; font-size: 20px;" do
          " " + title
        end
        html += tag.a class: "nav-link d-inline me-1 play", title: "tocar", data: { action: "click->hymn#track" }  do
          tag.i class: "bi bi-play-fill"
        end
        html += tag.a class: "nav-link d-inline me-1", title: "próximo hino", data: { action: "click->hymn#next" } do
          tag.i class: "bi bi-arrow-right-circle-fill"
        end
        html.html_safe
      end
    end
  end

  def paragraph(paragraph, i, size)
    tag.div class: "paragraph paragraph_#{ i }" do
      html = ""
      paragraph.each_with_index do |line, j|
        html += line(line, j, i)
        if line[:message]
          html += tag.div class: "line", style: "margin-left: calc(var(--size) * 2.3)" do
            tag.div class: "border-bottom mb-4 px-2 message", style: "width: calc(var(--size) * #{ size })" do
              tag.p line[:message], class: "text-end fst-italic fw-light m-1"
            end
          end
        end
      end
      html.html_safe
    end
  end

  def line(line, j, i)
    phrase = (line[:phrase] || "").gsub(/\s+/, "")
    tag.div class: "line line_#{ j } #{ 'pause' if line[:pause] }" do
      html = first_syllable(i, j, line)
      @first = true if line[:pause]
      i1 = 0
      i2 = 0
      while phrase.size > 0
        phrase, text = syllable_text(phrase)
        return if text.blank?

        html += tag.div class: "syllable syllable_#{ i2 / 2 }" do
          html = syllable_part(text, line, i, j, 1, i2, line[:inverse])
          if line[:halfs]&.include? i1 + 1
            phrase, text = syllable_text(phrase)
            i1 += 1
          else
            text = ""
          end
          html += syllable_part(text, line, i, j, 2, i2, line[:inverse])
          i1 += 1
          i2 += 2
          html.html_safe
        end
      end
      html.html_safe
    end
  end

  def narimono(line, index)
    html = ""
    Uta::INSTRUMENTS.each do |k|
      if line[k.to_sym]
        char = line[k.to_sym][index]&.strip()
        aux = "#{ 'stretch' if k == 'kotsuzumi' } #{ k }"
        aux = "#{ aux } #{ k }_#{ char }" if char.present?
        html += tag.div class: "icone d-none #{ aux }"
      end
    end
    html.html_safe
  end

  def syllable_part(text, l, i, j, p, q, v)
    return "" if l[:size] < p + q

    text = ""  if text == "_"
    text = "i" if text == "xi"
    text = "o" if text == "xo"
    c = "part part_#{ (p == 1 && !v) || (p == 2 && v) ? '1' : '2' }"
    d = { paragraph: i, line: j, syllable: q / 2, part: p }
    tag.span class: c do
      html  = ""
      html += tag.progress class: "beat beat_#{ p + q }", data: d, value: 0, max: 5 if l[:size] > p + q
      html += tag.div text, class: "part_text"
      html += narimono(l, q + p - 1)
      html.html_safe
    end
  end

  def syllable_text(phrase)
    text = nil
    Uta::SEARCHES.each do |s|
      r = Regexp.new("^#{ Regexp.escape(s) }")
      if r.match? phrase
        text = s
        phrase = phrase.gsub(r, "")
        break
      end
    end
    [ phrase, text ]
  end

  def first_syllable(i, j, line)
    tag.div class: "syllable d-none d-md-block" do
      clas = "beat first-beat #{ @first ? 'd-none' : '' }"
      data = { paragraph: i, line: j, syllable: -1, part: 1 }
      html = tag.progress class: clas, data: data, value: 0, max: 5

      if @first
        html += first_span(j, i)
        @first = false
      end

      html.html_safe
    end
  end

  def first_span(j, i)
    tag.span class: "first-span paragraph_#{ i } line_#{ j }" do
      html  = tag.span "."
      html += tag.span "."
      html += tag.span "."
      html.html_safe
    end
  end
end
