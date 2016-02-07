import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.HashSet;

public class Deck {
	
	public String deckId;
	
	public boolean useImgur;
	
	public double compressionLevel;

	public String backUrl;
	public String hiddenUrl;
	public BufferedImage hiddenImage;
	
	public ArrayList<Card> cardList = new ArrayList<Card>(100);
	public ArrayList<Card> transformList = new ArrayList<Card>(100);
	public HashSet<Token> tokens = new HashSet<Token>();
	
	public ArrayList<Card> unknownCards = new ArrayList<Card>(100);

	public BufferedImage[] buffers;
	public String[] deckFileNames;
	public String[] deckLinks;
	
	public Deck(){
		backUrl = Config.defaultBackImage;
	}
	
	public Card getCard(String cardKey) {
		for(Card card : cardList){
			if(card.cardKey.equals(cardKey)){
				return card;
			}
		}
		return null;
	}
	
	public void CleanUp(){
		hiddenImage = null;
		for(int i = 0; i < buffers.length; i++){
			buffers[i] = null;
		}
	}
	
	public void add(Card card){
		card.transformName = Transform.nameToTransformMap.get(card.name);
		if(card.transformName != null){
			transformList.add(card);
		}else{
			cardList.add(card);
		}
		
		ArrayList<Token> cardTokens = Token.cardToTokenMap.get(card.name);
		if(cardTokens != null){
			for(Token token : cardTokens){
				tokens.add(token);
			}
		}
	}
	
	public void Coolify(){		
		String[] basics = {"island","forest","mountain","swamp","plains"};
		String[] coolSets = {"uh","guru","al","zen"};
		for(int i = cardList.size()-1; i >= 0; i--){
			Card card = cardList.get(i);
			if(card.set == null && card.language == null && card.printing == null){
				for(String basicName : basics){
					if(card.name.equalsIgnoreCase(basicName)){
						int[][] newAmts = new int[card.amounts.length][coolSets.length];
						for(int j = 0; j < card.amounts.length; j++){
							for(int k = 0; k < card.amounts[j]; k++){
								newAmts[j][(int)(Math.random()*coolSets.length)]++;
							}
						}
						
						for(int j = 0; j < newAmts.length; j++){
							for(int k = 0; k < newAmts[j].length; k++){
								if(newAmts[j][k] == 0)continue;
								String cardKey = Card.getCardKey(basicName, coolSets[k], null, null);
								Card coolBasic = getCard(cardKey);
								if(coolBasic == null){
									coolBasic = new Card();
									coolBasic.name = basicName;
									coolBasic.cardKey = cardKey;
									coolBasic.set = coolSets[k];
									
									add(coolBasic);
								}
								coolBasic.amounts[j] += newAmts[j][k];
							}
						}
						
						cardList.remove(i);
					}
				}
			}
		}
	}
}
