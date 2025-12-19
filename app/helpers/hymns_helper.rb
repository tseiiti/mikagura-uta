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
        html += tag.span @j1, class: "mx-3"
        html += tag.span @j2, class: "mx-3"
      end
      html.html_safe
    end
  end

  def line(line, j, i)
    phrase = (line[:phrase] || "").gsub(/\s+/, "")
    tag.div class: "line line_#{ j } #{ 'pause' if line[:pause] }" do
      html = first_syllable(i, j, line)
      @first = true if line[:pause]
      # puts line[:last]
      i1 = 0
      i2 = 0
      while phrase.size > 0
        phrase, text = syllable_text(phrase)
        return if text.blank?

        # last = line[:last] == i1
        last = false
        attrs = [
          [
            "part_#{ line[:inverse] ? '2' : '1' } #{ 'last' if last }".strip,
            last ? nil : "beat beat_#{ i2 + 1 }",
            { paragraph: i, line: j, syllable: i2 / 2, part: 1 }
          ], [
            "part_#{ line[:inverse] ? '1' : '2' } #{ 'd-none' if last }".strip,
            "beat beat_#{ i2 + 2 }",
            { paragraph: i, line: j, syllable: i2 / 2, part: 2 }
          ]
        ]

        html += tag.div class: "syllable syllable_#{ i2 / 2 }" do
          html = syllable_part(text, attrs[0], narimono(line, i2))
          if line[:halfs]&.include? i1 + 1
            phrase, text = syllable_text(phrase)
            html += syllable_part(text, attrs[1], narimono(line, i2 + 1))
            i1 += 1
          else
            html += syllable_part("", attrs[1], narimono(line, i2 + 1))
          end
          i1 += 1
          i2 += 2
          html.html_safe
        end
      end
      @j1 = i1
      @j2 = i2
      # html += tag.span i1
      # html += tag.span " - "
      # html += tag.span i2
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

  def syllable_part(text, attrs, narimono)
    text = ""  if text == "_"
    text = "i" if text == "xi"
    text = "o" if text == "xo"
    tag.span class: "part #{ attrs[0] }" do
      html  = tag.progress class: attrs[1], data: attrs[2], value: 0, max: 5
      html += tag.div text, class: "part_text"
      html += narimono
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
